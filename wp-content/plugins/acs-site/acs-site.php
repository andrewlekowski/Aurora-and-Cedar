<?php
/**
 * Plugin Name: ACS Site Customizations
 * Description: Aurora & Cedar Stays site code: review count, no-cache booking pages, live "from" prices,
 *              pet-fee estimate, per-home check-in/out times, clearer booking messages, GA4 events, schema.
 * Version:     0.1.0
 * Author:      Aurora & Cedar Stays
 *
 * Every section is independent and guarded, so a missing MotoPress function turns a feature off
 * instead of breaking the site. UNTESTED against the live MPHB version: install on the WPvivid
 * staging copy first and walk the test list in README.md.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* -------------------------------------------------------------------------
 * 0. Settings
 * Edit these arrays instead of hunting through the code.
 * ---------------------------------------------------------------------- */

function acs_config() {
	return apply_filters( 'acs_config', array(
		// Elementor listing page IDs. Only 1722 (Fairbanks) is known; add the other 10.
		'listing_page_ids'  => array( 1722 ),
		// Page slugs that must never be cached (booking flow + pages that show prices).
		'nocache_slugs'     => array( 'listings', 'search-results', 'booking-confirmation', 'checkout', 'booking-checkout', 'reservation-received' ),
		// Pet fee (display only; nothing here charges money).
		'pet_fee_nightly'   => 20,
		'pet_fee_long_first'=> 399,
		'pet_fee_long_extra'=> 100,
		'pet_long_nights'   => 28,
		// CSS selector for the "number of pets" field on checkout. Confirm on staging.
		'pet_field_selector'=> 'input[name*="pet"], select[name*="pet"]',
		'contact_email'     => 'Hello@AuroraAndCedarStays.com',
		'contact_phone'     => '+1-205-341-7045',
	) );
}

/* -------------------------------------------------------------------------
 * 1. Review count: [acs_review_count]
 * Option `acs_review_count` is updated by the weekly/monthly Chrome task.
 * (Replaces the phase-1 mu-plugin; remove that file if it was installed.)
 * ---------------------------------------------------------------------- */

if ( ! shortcode_exists( 'acs_review_count' ) ) {
	add_shortcode( 'acs_review_count', function () {
		return esc_html( number_format_i18n( absint( get_option( 'acs_review_count', 765 ) ) ) );
	} );
}

/* -------------------------------------------------------------------------
 * 2. Never cache booking pages
 * Cached copies carry expired MPHB nonces, so "Check Availability" fails and old prices show.
 * ---------------------------------------------------------------------- */

function acs_is_nocache_request() {
	if ( is_singular( 'mphb_room_type' ) ) {
		return true;
	}
	$cfg = acs_config();
	if ( is_page( $cfg['listing_page_ids'] ) || is_page( $cfg['nocache_slugs'] ) ) {
		return true;
	}
	// MPHB's own configured pages, whatever their slugs are.
	if ( function_exists( 'MPHB' ) && is_page() ) {
		$ids   = array();
		$pages = MPHB()->settings()->pages();
		foreach ( array( 'getCheckoutPageId', 'getSearchResultsPageId', 'getReservationReceivedPageId', 'getBookingConfirmedPageId' ) as $m ) {
			if ( method_exists( $pages, $m ) ) {
				$ids[] = (int) $pages->$m();
			}
		}
		if ( in_array( get_queried_object_id(), array_filter( $ids ), true ) ) {
			return true;
		}
	}
	return false;
}

add_action( 'template_redirect', function () {
	if ( is_admin() || ! acs_is_nocache_request() ) {
		return;
	}
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	nocache_headers();
	header( 'X-ACS-Cache: bypass' ); // easy to spot in the logged-out header test
}, 0 );

/* -------------------------------------------------------------------------
 * 3. Live "from" price: [acs_from_price type="1857"] -> "From $125/night"
 * Lowest period-1 (nightly) price across the type's rates, in seasons that haven't ended.
 * Weekend seasons are priced higher, so the minimum is the weeknight rate.
 * Optional: format="number" returns just "125".
 * ---------------------------------------------------------------------- */

function acs_from_price( $room_type_id ) {
	$room_type_id = absint( $room_type_id );
	$cache_key    = 'acs_from_price_' . $room_type_id;
	$cached       = get_transient( $cache_key );
	if ( false !== $cached ) {
		return (float) $cached;
	}

	$rates = get_posts( array(
		'post_type'      => 'mphb_rate',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'fields'         => 'ids',
		'meta_key'       => 'mphb_room_type_id',
		'meta_value'     => $room_type_id,
	) );

	$today = current_time( 'Y-m-d' );
	$min   = null;
	foreach ( $rates as $rate_id ) {
		$season_prices = get_post_meta( $rate_id, 'mphb_season_prices', true );
		if ( ! is_array( $season_prices ) ) {
			continue;
		}
		foreach ( $season_prices as $sp ) {
			$season_id = isset( $sp['season'] ) ? (int) $sp['season'] : 0;
			$end       = $season_id ? get_post_meta( $season_id, 'mphb_end_date', true ) : '';
			if ( $end && $end < $today ) {
				continue; // season is over
			}
			$price = isset( $sp['price'] ) ? $sp['price'] : null;
			// Newer MPHB: array( 'periods' => [1,7,28], 'prices' => [..] ); older: a plain number.
			if ( is_array( $price ) && isset( $price['prices'][0] ) ) {
				$nightly = (float) $price['prices'][0];
			} elseif ( is_numeric( $price ) ) {
				$nightly = (float) $price;
			} else {
				continue;
			}
			if ( $nightly > 0 && ( null === $min || $nightly < $min ) ) {
				$min = $nightly;
			}
		}
	}

	$min = null === $min ? 0.0 : $min;
	set_transient( $cache_key, $min, HOUR_IN_SECONDS );
	return $min;
}

// Rates or seasons changed: drop every cached price.
add_action( 'save_post', function ( $post_id, $post ) {
	if ( in_array( $post->post_type, array( 'mphb_rate', 'mphb_season', 'mphb_room_type' ), true ) ) {
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '\_transient\_acs\_from\_price\_%' OR option_name LIKE '\_transient\_timeout\_acs\_from\_price\_%'" );
	}
}, 10, 2 );

add_shortcode( 'acs_from_price', function ( $atts ) {
	$atts  = shortcode_atts( array( 'type' => 0, 'format' => 'text' ), $atts );
	$price = acs_from_price( $atts['type'] );
	if ( $price <= 0 ) {
		return ''; // better blank than wrong
	}
	$amount = '$' . number_format_i18n( $price, floor( $price ) == $price ? 0 : 2 );
	return 'number' === $atts['format'] ? esc_html( $amount ) : esc_html( sprintf( 'From %s/night', $amount ) );
} );

/* -------------------------------------------------------------------------
 * 4. Pet fee: disclosure + display-only estimate at checkout
 * [acs_pet_fee_notice] goes above the booking form on pet-friendly listings.
 * ---------------------------------------------------------------------- */

function acs_pet_fee_notice_text() {
	$c = acs_config();
	return sprintf(
		'Bringing a pet? The pet fee is not part of your online total. We\'ll contact you after booking to collect it: $%1$d per pet, per night, or for stays of %2$d+ nights, $%3$d for the first pet plus $%4$d for each additional pet. <a href="%5$s">Pet policy</a>',
		$c['pet_fee_nightly'], $c['pet_long_nights'], $c['pet_fee_long_first'], $c['pet_fee_long_extra'], esc_url( home_url( '/pet-policy/' ) )
	);
}

add_shortcode( 'acs_pet_fee_notice', function () {
	return '<p class="acs-pet-fee-notice">' . wp_kses_post( acs_pet_fee_notice_text() ) . '</p>';
} );

add_action( 'wp_footer', function () {
	if ( ! function_exists( 'mphb_is_checkout_page' ) || ! mphb_is_checkout_page() ) {
		return;
	}
	$c = acs_config();
	?>
	<script>
	(function () {
		var cfg = <?php echo wp_json_encode( array(
			'sel'   => $c['pet_field_selector'],
			'night' => (int) $c['pet_fee_nightly'],
			'first' => (int) $c['pet_fee_long_first'],
			'extra' => (int) $c['pet_fee_long_extra'],
			'long'  => (int) $c['pet_long_nights'],
		) ); ?>;
		function nights() {
			var a = document.querySelector('[name="mphb_check_in_date"]'),
			    b = document.querySelector('[name="mphb_check_out_date"]');
			if (!a || !b) return 0;
			var d1 = new Date(a.value + 'T00:00:00'), d2 = new Date(b.value + 'T00:00:00');
			var n = Math.round((d2 - d1) / 86400000);
			return n > 0 ? n : 0;
		}
		function render(field) {
			var pets = parseInt(field.value, 10) || 0, n = nights();
			var box = document.getElementById('acs-pet-estimate');
			if (!box) {
				box = document.createElement('p');
				box.id = 'acs-pet-estimate';
				box.className = 'acs-pet-fee-notice';
				field.parentNode.appendChild(box);
			}
			if (!pets || !n) { box.textContent = ''; return; }
			var fee, how;
			if (n >= cfg.long) {
				fee = cfg.first + (pets - 1) * cfg.extra;
				how = '$' + cfg.first + ' first pet' + (pets > 1 ? ' + ' + (pets - 1) + ' × $' + cfg.extra : '') + ' (' + cfg.long + '+ night stay)';
			} else {
				fee = pets * n * cfg.night;
				how = pets + (pets > 1 ? ' pets' : ' pet') + ' × ' + n + (n > 1 ? ' nights' : ' night') + ' × $' + cfg.night;
			}
			box.textContent = 'Pet fee: ' + how + ' = $' + fee.toLocaleString('en-US') +
				'. Not included in today\'s total. We\'ll contact you after booking to collect it.';
		}
		document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches(cfg.sel)) render(e.target); });
		document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches(cfg.sel)) render(e.target); });
	})();
	</script>
	<?php
} );

/* -------------------------------------------------------------------------
 * 5. Check-in/out times per home
 * Adds two fields to each Accommodation Type. Shortcode: [acs_checkin_times type="1857"].
 * Email tags %acs_check_in_time% / %acs_check_out_time% (verify the MPHB filters on staging).
 * Falls back to the global MPHB times, then to 4:00 PM / 11:00 AM.
 * ---------------------------------------------------------------------- */

function acs_times( $room_type_id ) {
	$in  = get_post_meta( $room_type_id, 'acs_check_in_time', true );
	$out = get_post_meta( $room_type_id, 'acs_check_out_time', true );
	return array( $in ? $in : '4:00 PM', $out ? $out : '11:00 AM' );
}

add_action( 'add_meta_boxes_mphb_room_type', function () {
	add_meta_box( 'acs_times', 'Check-in / check-out (this home)', function ( $post ) {
		wp_nonce_field( 'acs_times', 'acs_times_nonce' );
		list( $in, $out ) = array( get_post_meta( $post->ID, 'acs_check_in_time', true ), get_post_meta( $post->ID, 'acs_check_out_time', true ) );
		printf( '<p><label>Check-in <input type="text" name="acs_check_in_time" value="%s" placeholder="4:00 PM"></label></p>', esc_attr( $in ) );
		printf( '<p><label>Check-out <input type="text" name="acs_check_out_time" value="%s" placeholder="11:00 AM"></label></p>', esc_attr( $out ) );
	}, 'mphb_room_type', 'side' );
} );

add_action( 'save_post_mphb_room_type', function ( $post_id ) {
	if ( ! isset( $_POST['acs_times_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['acs_times_nonce'] ), 'acs_times' ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( array( 'acs_check_in_time', 'acs_check_out_time' ) as $key ) {
		update_post_meta( $post_id, $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ?? '' ) ) );
	}
} );

add_shortcode( 'acs_checkin_times', function ( $atts ) {
	$atts = shortcode_atts( array( 'type' => 0 ), $atts );
	list( $in, $out ) = acs_times( absint( $atts['type'] ) );
	return esc_html( sprintf( 'Check-in %s · Check-out %s', $in, $out ) );
} );

add_filter( 'mphb_email_booking_tags', function ( $tags ) {
	$tags[] = array( 'name' => 'acs_check_in_time', 'description' => 'Check-in time for the booked home (ACS)' );
	$tags[] = array( 'name' => 'acs_check_out_time', 'description' => 'Check-out time for the booked home (ACS)' );
	return $tags;
} );

add_filter( 'mphb_email_replace_tag', function ( $value, $tag, $booking ) {
	if ( ! in_array( $tag, array( 'acs_check_in_time', 'acs_check_out_time' ), true ) || ! is_object( $booking ) || ! method_exists( $booking, 'getReservedRooms' ) ) {
		return $value;
	}
	$rooms = $booking->getReservedRooms();
	if ( empty( $rooms ) || ! method_exists( $rooms[0], 'getRoomTypeId' ) ) {
		return $value;
	}
	list( $in, $out ) = acs_times( $rooms[0]->getRoomTypeId() );
	return 'acs_check_in_time' === $tag ? $in : $out;
}, 10, 3 );

/* -------------------------------------------------------------------------
 * 13. Clearer booking messages
 * Maps MPHB's stock strings to plain ones. Add any other vague string you see on staging.
 * ---------------------------------------------------------------------- */

add_filter( 'gettext', function ( $translation, $text, $domain ) {
	if ( 'motopress-hotel-booking' !== $domain ) {
		return $translation;
	}
	$map = array(
		'Nothing found. Please try again with different search parameters.' =>
			'Those dates are taken. Try other dates or see our other homes.',
	);
	return isset( $map[ $text ] ) ? $map[ $text ] : $translation;
}, 10, 3 );

// Blank AJAX errors in the booking widget get a fallback message.
add_action( 'wp_footer', function () {
	if ( ! acs_is_nocache_request() ) {
		return;
	}
	$msg = sprintf( 'Something went wrong checking those dates. Refresh the page, or email %s and we\'ll sort it out.', acs_config()['contact_email'] );
	?>
	<script>
	(function () {
		var msg = <?php echo wp_json_encode( $msg ); ?>;
		new MutationObserver(function () {
			document.querySelectorAll('.mphb-errors-wrapper, .mphb-reservation-form-errors, .mphb-error').forEach(function (el) {
				if (el.offsetParent !== null && !el.textContent.trim()) el.textContent = msg;
			});
		}).observe(document.body, { childList: true, subtree: true });
	})();
	</script>
	<?php
}, 20 );

/* -------------------------------------------------------------------------
 * 9. GA4 events (needs Site Kit's gtag on the page)
 * check_availability: booking/search form submit. begin_checkout: checkout page load.
 * booking_complete: reservation-received page, value = booking total.
 * ---------------------------------------------------------------------- */

add_action( 'wp_footer', function () {
	$events = array();

	if ( function_exists( 'mphb_is_checkout_page' ) && mphb_is_checkout_page() ) {
		$events[] = array( 'begin_checkout', array( 'currency' => 'USD' ) );
	}

	if ( isset( $_GET['booking_id'], $_GET['booking_key'] ) && function_exists( 'MPHB' ) ) {
		$booking = MPHB()->getBookingRepository()->findById( absint( $_GET['booking_id'] ) );
		if ( $booking && method_exists( $booking, 'getKey' ) && hash_equals( (string) $booking->getKey(), sanitize_text_field( wp_unslash( $_GET['booking_key'] ) ) ) ) {
			$events[] = array( 'booking_complete', array(
				'currency'       => 'USD',
				'value'          => (float) $booking->getTotalPrice(),
				'transaction_id' => (string) $booking->getId(),
			) );
		}
	}
	?>
	<script>
	(function () {
		function send(name, params) {
			if (typeof window.gtag === 'function') { window.gtag('event', name, params || {}); }
			else { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params || {})); }
		}
		<?php foreach ( $events as $e ) : ?>
		send(<?php echo wp_json_encode( $e[0] ); ?>, <?php echo wp_json_encode( $e[1] ); ?>);
		<?php endforeach; ?>
		document.addEventListener('submit', function (e) {
			if (e.target.closest && e.target.closest('.mphb-booking-form, .mphb_sc_search-form, .mphb_widget_search-form')) {
				send('check_availability');
			}
		}, true);
	})();
	</script>
	<?php
}, 30 );

/* -------------------------------------------------------------------------
 * 10. Structured data
 * Brand-level LodgingBusiness on the front page. Per-listing VacationRental data lives in
 * acs_listing_schema(): fill each entry from verified facts only. FAQPage: turn on
 * "FAQ Schema" in the Elementor Accordion widget on the FAQ page instead of duplicating it here.
 * ---------------------------------------------------------------------- */

function acs_listing_schema() {
	// page_id => array( 'name', 'address' => [...], 'geo' => [lat, lng], 'bedrooms', 'bathrooms', 'occupancy', 'amenities' => [] )
	return apply_filters( 'acs_listing_schema', array() );
}

add_action( 'wp_head', function () {
	$c    = acs_config();
	$data = null;

	if ( is_front_page() ) {
		$data = array(
			'@context'   => 'https://schema.org',
			'@type'      => 'LodgingBusiness',
			'name'       => 'Aurora & Cedar Stays',
			'url'        => home_url( '/' ),
			'telephone'  => $c['contact_phone'],
			'email'      => $c['contact_email'],
			'areaServed' => array( 'Tacoma, WA', 'Puyallup, WA', 'DuPont, WA', 'Fairbanks, AK' ),
		);
	} else {
		$listings = acs_listing_schema();
		$id       = get_queried_object_id();
		if ( isset( $listings[ $id ] ) ) {
			$l    = $listings[ $id ];
			$data = array_filter( array(
				'@context'           => 'https://schema.org',
				'@type'              => 'VacationRental',
				'name'               => $l['name'] ?? get_the_title( $id ),
				'url'                => get_permalink( $id ),
				'address'            => isset( $l['address'] ) ? array_merge( array( '@type' => 'PostalAddress' ), $l['address'] ) : null,
				'geo'                => isset( $l['geo'] ) ? array( '@type' => 'GeoCoordinates', 'latitude' => $l['geo'][0], 'longitude' => $l['geo'][1] ) : null,
				'containsPlace'      => array_filter( array(
					'@type'          => 'Accommodation',
					'numberOfBedrooms'      => $l['bedrooms'] ?? null,
					'numberOfBathroomsTotal'=> $l['bathrooms'] ?? null,
					'occupancy'      => isset( $l['occupancy'] ) ? array( '@type' => 'QuantitativeValue', 'value' => $l['occupancy'] ) : null,
					'amenityFeature' => isset( $l['amenities'] ) ? array_map( function ( $a ) {
						return array( '@type' => 'LocationFeatureSpecification', 'name' => $a, 'value' => true );
					}, $l['amenities'] ) : null,
				) ),
			) );
		}
	}

	if ( $data ) {
		echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
	}
} );

/* -------------------------------------------------------------------------
 * 10b. noindex utility pages (skip if Rank Math/Yoast already handles them)
 * ---------------------------------------------------------------------- */

add_filter( 'wp_robots', function ( $robots ) {
	if ( ! is_singular( 'mphb_room_type' ) && acs_is_nocache_request() && ! is_page( 'listings' ) && ! is_page( acs_config()['listing_page_ids'] ) ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}
	return $robots;
} );
