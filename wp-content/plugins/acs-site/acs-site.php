<?php
/**
 * Plugin Name: ACS Site Customizations
 * Description: Aurora & Cedar Stays site code: review count, no-cache booking pages, live "from" prices,
 *              pet-fee estimate, per-home check-in/out times, clearer booking messages, GA4 events, schema,
 *              city search, weekly/monthly discount display, search results → checkout.
 * Version:     0.2.1
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
		// Elementor listing page IDs (all 11 homes).
		'listing_page_ids'  => array( 1722, 1560, 1536, 1503, 1481, 1449, 1424, 1365, 1325, 1265, 1077 ),
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
		// Feature switches for sections 15-17 (set to false to turn one off).
		'city_search'       => true,
		'discount_display'  => true,
		'results_checkout'  => true,
		'long_stay_notice'  => true,
		'long_stay_nights'  => 28,
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

/* -------------------------------------------------------------------------
 * Shared helpers for sections 15-17
 * ---------------------------------------------------------------------- */

/** Plain-text money, e.g. "$125.00", using MotoPress's own formatting. */
function acs_money_text( $amount ) {
	$text = html_entity_decode( wp_strip_all_tags( mphb_format_price( $amount ) ), ENT_QUOTES, 'UTF-8' );
	return trim( str_replace( "\xC2\xA0", ' ', $text ) );
}

/**
 * The Elementor listing page for an accommodation type (same slug), falling back to the
 * MotoPress accommodation URL (which redirects there anyway, but drops query args).
 */
function acs_listing_url( $roomType ) {
	$slug = get_post_field( 'post_name', $roomType->getOriginalId() );
	$page = $slug ? get_page_by_path( $slug, OBJECT, 'page' ) : null;
	return ( $page && 'publish' === $page->post_status ) ? get_permalink( $page ) : $roomType->getLink();
}

function acs_listing_url_with_dates( $roomType, \DateTime $checkIn, \DateTime $checkOut, $adults = '', $children = '' ) {
	$format = MPHB()->settings()->dateTime()->getDateTransferFormat();
	return add_query_arg( array(
		'mphb_check_in_date'  => $checkIn->format( $format ),
		'mphb_check_out_date' => $checkOut->format( $format ),
		'mphb_adults'         => (int) $adults,
		'mphb_children'       => (int) $children,
		'acs_prefill'         => 1,
	), acs_listing_url( $roomType ) );
}

/**
 * Undiscounted (1-night period) price for every date of a rate, computed with MotoPress's own
 * season-price logic: we only switch the request's nights count to 1 and switch it back.
 *
 * @return array [ 'Y-m-d' => price ]
 */
function acs_base_prices_for_rate( $rate ) {
	$request = MPHB()->reservationRequest();
	$prev    = $request->getNightsCount();
	$request->setupParameter( 'nights_count', 1 );

	$base = array();
	foreach ( (array) $rate->getSeasonPrices() as $seasonPrice ) {
		// Same merge order as \MPHB\Entities\Rate::getDatePrices().
		$base = array_merge( $base, $seasonPrice->getDatePrices() );
	}

	$request->setupParameter( 'nights_count', $prev );
	return $base;
}

/**
 * Compare the nightly prices MotoPress charged with the undiscounted ones.
 * The percentage comes from the rate data (charged ÷ base), never a hard-coded 10/20.
 *
 * @param array $charged [ 'Y-m-d' => price actually charged ]
 * @param array $base    [ 'Y-m-d' => 1-night price ]
 * @return array|null Null for stays under 7 nights or when nothing is discounted.
 */
function acs_stay_discount_info( array $charged, array $base ) {
	$nights = count( $charged );
	if ( $nights < 7 ) {
		return null;
	}
	$baseList = array();
	foreach ( $charged as $date => $price ) {
		$baseList[ $date ] = isset( $base[ $date ] ) ? (float) $base[ $date ] : (float) $price;
	}
	$baseTotal    = array_sum( $baseList );
	$chargedTotal = array_sum( array_map( 'floatval', $charged ) );
	$discount     = round( $baseTotal - $chargedTotal, 2 );
	if ( $baseTotal <= 0 || $discount < 0.01 ) {
		return null;
	}
	return array(
		'nights'        => $nights,
		'base'          => $baseList,
		'base_total'    => round( $baseTotal, 2 ),
		'charged_total' => round( $chargedTotal, 2 ),
		'discount'      => $discount,
		'pct'           => (int) round( $discount / $baseTotal * 100 ),
		'label'         => $nights >= 28 ? 'Monthly' : 'Weekly',
	);
}

/* -------------------------------------------------------------------------
 * 15. City search (moved out of the MotoPress plugin folder)
 * The [mphb_airbnb_search] form, City/Amenities/Pets result filters, the results card and the
 * "Property Location & Policy" meta box used to live inside motopress-hotel-booking (a hand edit
 * in plugin.php + includes/airbnb-search/). A MotoPress update would have wiped it. This is the
 * same code with the same shortcode, taxonomy, meta keys, URL parameters and CSS classes, so
 * nothing changes for guests or in wp-admin. While the old copy is still inside MotoPress, it is
 * switched off here on 'mphb_loaded'; deactivating this plugin brings the old copy back.
 * ---------------------------------------------------------------------- */

class ACS_City_Search {

	const CITY_TAX    = 'mphb_city';
	const META_STREET = 'mphb_street_address';
	const META_ZIP    = 'mphb_zip';
	const META_PETS   = 'mphb_pets_allowed';
	const NONCE       = 'mphb_air_location_nonce';

	private static $instance = null;

	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'registerCityTaxonomy' ), 11 );
		add_action( 'add_meta_boxes', array( $this, 'addLocationMetaBox' ) );
		add_action( 'save_post', array( $this, 'saveLocationMeta' ), 10, 2 );
		add_shortcode( 'mphb_airbnb_search', array( $this, 'renderSearchForm' ) );
		add_filter( 'the_posts', array( $this, 'filterSearchResults' ), 20, 2 );
		add_action( 'mphb_sc_search_render_form_top', array( $this, 'renderHiddenFilterInputs' ) );
		add_filter( 'mphb_get_template_part', array( $this, 'overrideRoomContentTemplate' ), 10, 3 );
		add_action( 'mphb_sc_search_results_before_loop', array( $this, 'openResultsLayout' ), 20 );
		add_action( 'mphb_sc_search_results_after_loop', array( $this, 'closeResultsLayout' ), 5 );
		add_action( 'mphb_render_single_room_type_after_title', array( $this, 'renderSingleAddress' ), 15 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueuePublic' ), 12 );
	}

	/** Remove every hook the hand-edited copy inside MotoPress registered. */
	public static function disableMotoPressCopy() {
		if ( ! class_exists( '\MPHB\AirbnbSearch\AirbnbSearch' ) ) {
			return;
		}
		$old = \MPHB\AirbnbSearch\AirbnbSearch::instance();
		remove_action( 'init', array( $old, 'registerCityTaxonomy' ), 11 );
		remove_action( 'add_meta_boxes', array( $old, 'addLocationMetaBox' ) );
		remove_action( 'save_post', array( $old, 'saveLocationMeta' ), 10 );
		remove_shortcode( 'mphb_airbnb_search' );
		remove_filter( 'the_posts', array( $old, 'filterSearchResults' ), 20 );
		remove_action( 'mphb_sc_search_render_form_top', array( $old, 'renderHiddenFilterInputs' ) );
		remove_filter( 'mphb_get_template_part', array( $old, 'overrideRoomContentTemplate' ), 10 );
		remove_action( 'mphb_sc_search_results_before_loop', array( $old, 'openResultsLayout' ), 20 );
		remove_action( 'mphb_sc_search_results_after_loop', array( $old, 'closeResultsLayout' ), 5 );
		remove_action( 'mphb_render_single_room_type_after_title', array( $old, 'renderSingleAddress' ), 15 );
		remove_action( 'wp_enqueue_scripts', array( $old, 'enqueuePublic' ), 12 );
	}

	private function templatePath( $name ) {
		return plugin_dir_path( __FILE__ ) . 'templates/city-search/' . $name . '.php';
	}

	/* ---- Data model (admin) ---- */

	public function registerCityTaxonomy() {
		$postType = MPHB()->postTypes()->roomType()->getPostType();

		register_taxonomy(
			self::CITY_TAX,
			$postType,
			array(
				'labels'            => array(
					'name'          => __( 'Cities', 'acs-site' ),
					'singular_name' => __( 'City', 'acs-site' ),
					'search_items'  => __( 'Search Cities', 'acs-site' ),
					'all_items'     => __( 'All Cities', 'acs-site' ),
					'edit_item'     => __( 'Edit City', 'acs-site' ),
					'update_item'   => __( 'Update City', 'acs-site' ),
					'add_new_item'  => __( 'Add New City', 'acs-site' ),
					'new_item_name' => __( 'New City Name', 'acs-site' ),
					'menu_name'     => __( 'Cities', 'acs-site' ),
					'not_found'     => __( 'No cities found.', 'acs-site' ),
				),
				'public'            => true,
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_in_menu'      => MPHB()->menus()->getMainMenuSlug(),
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'query_var'         => true,
				'rewrite'           => array( 'slug' => 'city', 'with_front' => false ),
			)
		);
		register_taxonomy_for_object_type( self::CITY_TAX, $postType );

		// Same one-time options as the old copy, so these don't run again.
		if ( ! get_option( 'mphb_air_cities_seeded' ) ) {
			foreach ( array( 'Tacoma, WA', 'Puyallup, WA', 'DuPont, WA', 'Fairbanks, AK' ) as $name ) {
				if ( ! term_exists( $name, self::CITY_TAX ) ) {
					wp_insert_term( $name, self::CITY_TAX );
				}
			}
			update_option( 'mphb_air_cities_seeded', 1 );
		}
		if ( ! get_option( 'mphb_air_city_flushed' ) ) {
			flush_rewrite_rules( false );
			update_option( 'mphb_air_city_flushed', 1 );
		}
	}

	public function addLocationMetaBox() {
		add_meta_box(
			'mphb_air_location',
			__( 'Property Location & Policy', 'acs-site' ),
			array( $this, 'renderLocationMetaBox' ),
			MPHB()->postTypes()->roomType()->getPostType(),
			'normal',
			'high'
		);
	}

	public function renderLocationMetaBox( $post ) {
		wp_nonce_field( self::NONCE, self::NONCE );
		$street = get_post_meta( $post->ID, self::META_STREET, true );
		$zip    = get_post_meta( $post->ID, self::META_ZIP, true );
		$pets   = get_post_meta( $post->ID, self::META_PETS, true );
		?>
		<style>
			.mphb-air-loc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
			.mphb-air-loc-grid .full{grid-column:1/-1}
			.mphb-air-loc-grid label{display:block;font-weight:600;margin-bottom:4px}
			.mphb-air-loc-grid input[type=text]{width:100%}
			.mphb-air-loc-hint{color:#666;font-size:12px;margin-top:4px}
		</style>
		<div class="mphb-air-loc-grid">
			<p class="full">
				<label for="mphb_air_street"><?php esc_html_e( 'Street address', 'acs-site' ); ?></label>
				<input type="text" id="mphb_air_street" name="<?php echo esc_attr( self::META_STREET ); ?>" value="<?php echo esc_attr( $street ); ?>" placeholder="328 129th St S" />
				<span class="mphb-air-loc-hint"><?php esc_html_e( 'Pick the city in the "Cities" box. Guests will see: street, city, ZIP — e.g. 328 129th St S, Tacoma, WA 98444.', 'acs-site' ); ?></span>
			</p>
			<p>
				<label for="mphb_air_zip"><?php esc_html_e( 'ZIP / Postal code', 'acs-site' ); ?></label>
				<input type="text" id="mphb_air_zip" name="<?php echo esc_attr( self::META_ZIP ); ?>" value="<?php echo esc_attr( $zip ); ?>" placeholder="98444" />
			</p>
			<p>
				<label><?php esc_html_e( 'Pets', 'acs-site' ); ?></label>
				<label style="font-weight:400">
					<input type="checkbox" name="<?php echo esc_attr( self::META_PETS ); ?>" value="1" <?php checked( $pets, '1' ); ?> />
					<?php esc_html_e( 'Pets allowed at this property', 'acs-site' ); ?>
				</label>
			</p>
		</div>
		<?php
	}

	public function saveLocationMeta( $postId, $post ) {
		if ( ! isset( $_POST[ self::NONCE ] ) || ! wp_verify_nonce( sanitize_key( $_POST[ self::NONCE ] ), self::NONCE ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( $post->post_type !== MPHB()->postTypes()->roomType()->getPostType() || ! current_user_can( 'edit_post', $postId ) ) {
			return;
		}
		$street = isset( $_POST[ self::META_STREET ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::META_STREET ] ) ) : '';
		$zip    = isset( $_POST[ self::META_ZIP ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::META_ZIP ] ) ) : '';
		$pets   = ! empty( $_POST[ self::META_PETS ] ) ? '1' : '0';
		update_post_meta( $postId, self::META_STREET, $street );
		update_post_meta( $postId, self::META_ZIP, $zip );
		update_post_meta( $postId, self::META_PETS, $pets );
	}

	/* ---- Address helpers ---- */

	public function getCityName( $postId ) {
		$terms = get_the_terms( $postId, self::CITY_TAX );
		return ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->name : '';
	}

	/** "{street}, {city} {zip}" => "328 129th St S, Tacoma, WA 98444". */
	public function fullAddress( $postId ) {
		$street  = get_post_meta( $postId, self::META_STREET, true );
		$zip     = get_post_meta( $postId, self::META_ZIP, true );
		$cityZip = trim( $this->getCityName( $postId ) . ' ' . $zip );
		return implode( ', ', array_filter( array( $street, $cityZip ) ) );
	}

	/* ---- Search form ---- */

	public function renderSearchForm( $atts ) {
		// Make sure datepicker + booking scripts/styles load.
		do_action( 'mphb_sc_search_before_form' );
		MPHB()->getPublicScriptManager()->enqueue();

		$stored = MPHB()->searchParametersStorage()->get();

		$checkInStored  = isset( $_GET['mphb_check_in_date'] ) ? sanitize_text_field( wp_unslash( $_GET['mphb_check_in_date'] ) ) : ( isset( $stored['mphb_check_in_date'] ) ? $stored['mphb_check_in_date'] : '' );
		$checkOutStored = isset( $_GET['mphb_check_out_date'] ) ? sanitize_text_field( wp_unslash( $_GET['mphb_check_out_date'] ) ) : ( isset( $stored['mphb_check_out_date'] ) ? $stored['mphb_check_out_date'] : '' );

		$transferFormat = MPHB()->settings()->dateTime()->getDateTransferFormat();
		$displayFormat  = MPHB()->settings()->dateTime()->getDateFormat();

		$amenities = get_terms( array( 'taxonomy' => MPHB()->postTypes()->roomType()->getFacilityTaxName(), 'hide_empty' => false ) );
		$cities    = get_terms( array( 'taxonomy' => self::CITY_TAX, 'hide_empty' => false ) );

		$vars = array(
			'action'           => MPHB()->settings()->pages()->getSearchResultsPageUrl(),
			'uniqid'           => uniqid( 'mphb-air-' ),
			// Stored values are in transfer format (Y-m-d); the visible field needs the display format.
			'checkInDisplay'   => $checkInStored ? \MPHB\Utils\DateUtils::convertDateFormat( $checkInStored, $transferFormat, $displayFormat ) : '',
			'checkOutDisplay'  => $checkOutStored ? \MPHB\Utils\DateUtils::convertDateFormat( $checkOutStored, $transferFormat, $displayFormat ) : '',
			'checkInTransfer'  => $checkInStored,
			'checkOutTransfer' => $checkOutStored,
			'adults'           => isset( $_GET['mphb_adults'] ) ? absint( $_GET['mphb_adults'] ) : MPHB()->settings()->main()->getMinAdults(),
			'children'         => isset( $_GET['mphb_children'] ) ? absint( $_GET['mphb_children'] ) : MPHB()->settings()->main()->getMinChildren(),
			'selCity'          => isset( $_GET['mphb_city'] ) ? absint( $_GET['mphb_city'] ) : 0,
			'selPets'          => ! empty( $_GET['mphb_pets'] ),
			'selAmen'          => isset( $_GET['mphb_amenities'] ) ? array_map( 'absint', (array) $_GET['mphb_amenities'] ) : array(),
			'cities'           => is_wp_error( $cities ) ? array() : $cities,
			'amenities'        => is_wp_error( $amenities ) ? array() : $amenities,
			'childrenAllowed'  => MPHB()->settings()->main()->isChildrenAllowed(),
			'childrenAgeText'  => MPHB()->settings()->main()->getChildrenAgeText(),
			'minAdults'        => MPHB()->settings()->main()->getMinAdults(),
			'maxAdults'        => MPHB()->settings()->main()->getSearchMaxAdults(),
			'maxChildren'      => MPHB()->settings()->main()->getSearchMaxChildren(),
		);

		ob_start();
		extract( $vars ); // phpcs:ignore WordPress.PHP.DontExtract
		include $this->templatePath( 'search-form' );
		return ob_get_clean();
	}

	/** Keep the extra filters when MotoPress's default search form is used for a re-search. */
	public function renderHiddenFilterInputs() {
		foreach ( array( 'mphb_city', 'mphb_pets' ) as $key ) {
			if ( isset( $_GET[ $key ] ) && $_GET[ $key ] !== '' ) {
				printf( '<input type="hidden" name="%s" value="%s" />', esc_attr( $key ), esc_attr( wp_unslash( $_GET[ $key ] ) ) );
			}
		}
		if ( isset( $_GET['mphb_amenities'] ) ) {
			foreach ( (array) $_GET['mphb_amenities'] as $amen ) {
				printf( '<input type="hidden" name="mphb_amenities[]" value="%s" />', esc_attr( absint( $amen ) ) );
			}
		}
	}

	/* ---- Results filtering (City / Amenities / Pets) ---- */

	/**
	 * Drop room types that don't match the filters. Only on the search results page, only for
	 * the results query (all matches via post__in), and only when a filter is active. Core
	 * availability logic is untouched.
	 */
	public function filterSearchResults( $posts, $wpQuery ) {
		if ( is_admin() || empty( $posts ) ) {
			return $posts;
		}
		if ( ! function_exists( 'mphb_is_search_results_page' ) || ! mphb_is_search_results_page() ) {
			return $posts;
		}
		if ( $wpQuery->get( 'post_type' ) !== MPHB()->postTypes()->roomType()->getPostType() ) {
			return $posts;
		}
		if ( (int) $wpQuery->get( 'posts_per_page' ) !== -1 || ! $wpQuery->get( 'post__in' ) ) {
			return $posts;
		}

		$city      = isset( $_GET['mphb_city'] ) ? absint( $_GET['mphb_city'] ) : 0;
		$pets      = ! empty( $_GET['mphb_pets'] );
		$amenities = isset( $_GET['mphb_amenities'] ) ? array_filter( array_map( 'absint', (array) $_GET['mphb_amenities'] ) ) : array();

		if ( ! $city && ! $pets && empty( $amenities ) ) {
			return $posts;
		}

		$facilityTax = MPHB()->postTypes()->roomType()->getFacilityTaxName();

		return array_values( array_filter(
			$posts,
			function ( $post ) use ( $city, $pets, $amenities, $facilityTax ) {
				if ( $city && ! has_term( $city, ACS_City_Search::CITY_TAX, $post ) ) {
					return false;
				}
				if ( $pets && get_post_meta( $post->ID, ACS_City_Search::META_PETS, true ) !== '1' ) {
					return false;
				}
				foreach ( $amenities as $amenId ) { // Property must have every selected amenity.
					if ( ! has_term( $amenId, $facilityTax, $post ) ) {
						return false;
					}
				}
				return true;
			}
		) );
	}

	/* ---- Results layout ---- */

	public function overrideRoomContentTemplate( $template, $slug, $atts ) {
		$map = array(
			'shortcodes/search-results/room-content' => 'room-card',
			'shortcodes/search-results/results-info' => 'results-info',
		);
		if ( isset( $map[ $slug ] ) && file_exists( $this->templatePath( $map[ $slug ] ) ) ) {
			return $this->templatePath( $map[ $slug ] );
		}
		return $template;
	}

	public function openResultsLayout() {
		echo '<div class="mphb-air-list">';
	}

	public function closeResultsLayout() {
		echo '</div>';
	}

	/* ---- Single listing: full address ---- */

	public function renderSingleAddress() {
		$address = $this->fullAddress( get_the_ID() );
		if ( $address ) {
			echo '<p class="mphb-air-single-address"><span class="mphb-air-dot" aria-hidden="true">&#9679;</span> ' . esc_html( $address ) . '</p>';
		}
	}

	/* ---- Assets ---- */

	private function needsAssets() {
		if ( function_exists( 'mphb_is_search_results_page' ) && mphb_is_search_results_page() ) {
			return true;
		}
		if ( is_singular( MPHB()->postTypes()->roomType()->getPostType() ) ) {
			return true;
		}
		global $post;
		return $post instanceof \WP_Post && has_shortcode( (string) $post->post_content, 'mphb_airbnb_search' );
	}

	public function enqueuePublic() {
		if ( ! $this->needsAssets() ) {
			return;
		}
		$dir = plugin_dir_path( __FILE__ ) . 'assets/';
		$url = plugin_dir_url( __FILE__ ) . 'assets/';
		// Version by file mtime so edits always bust browser/CDN caches.
		wp_enqueue_style( 'mphb-air-search', $url . 'city-search.css', array(), (string) @filemtime( $dir . 'city-search.css' ) );
		wp_enqueue_script( 'mphb-air-search', $url . 'city-search.js', array( 'jquery' ), (string) @filemtime( $dir . 'city-search.js' ), true );
	}
}

add_action( 'mphb_loaded', function () {
	if ( ! acs_config()['city_search'] ) {
		return;
	}
	ACS_City_Search::disableMotoPressCopy();
	ACS_City_Search::instance();
}, 20 );

/* -------------------------------------------------------------------------
 * 16. Weekly / monthly discount display (display only)
 * MotoPress charges the 7- or 28-night period price but never says it's a discount. We add the
 * comparison to the price-breakdown data (a new top-level key; totals untouched) and decorate the
 * breakdown HTML on checkout, on its AJAX re-renders, and in the booking emails.
 * ---------------------------------------------------------------------- */

add_filter( 'mphb_booking_price_breakdown', function ( $breakdown, $booking ) {
	if ( ! acs_config()['discount_display'] || empty( $breakdown['rooms'] ) || ! is_object( $booking ) || ! method_exists( $booking, 'getReservedRooms' ) ) {
		return $breakdown;
	}
	try {
		$reservedRooms = array_values( (array) $booking->getReservedRooms() );
		$rooms         = array();
		$total         = 0.0;
		foreach ( $breakdown['rooms'] as $i => $roomBreakdown ) {
			if ( empty( $roomBreakdown['room']['list'] ) || ! isset( $reservedRooms[ $i ] ) ) {
				continue;
			}
			$rate = MPHB()->getRateRepository()->findById( $reservedRooms[ $i ]->getRateId() );
			if ( ! $rate ) {
				continue;
			}
			// Same request state MotoPress used for this room's prices.
			MPHB()->reservationRequest()->setupParameters( array(
				'adults'         => $reservedRooms[ $i ]->getAdults(),
				'children'       => $reservedRooms[ $i ]->getChildren(),
				'check_in_date'  => $booking->getCheckInDate(),
				'check_out_date' => $booking->getCheckOutDate(),
			) );
			$info = acs_stay_discount_info( $roomBreakdown['room']['list'], acs_base_prices_for_rate( $rate ) );
			if ( $info ) {
				$rooms[ $i ] = $info;
				$total      += $info['discount'];
			}
		}
		if ( $rooms ) {
			$breakdown['acs_stay_discount'] = array( 'rooms' => $rooms, 'discount' => round( $total, 2 ) );
		}
	} catch ( \Throwable $e ) {
		return $breakdown; // Never let the display break checkout.
	}
	$GLOBALS['acs_last_price_breakdown'] = $breakdown;
	return $breakdown;
}, 20, 2 );

/**
 * Add the badge, crossed-out nightly prices, "before discount" + discount rows and the savings
 * line to MotoPress's price-breakdown table. Returns the HTML unchanged when there's nothing to show.
 *
 * @param string $html      Output of \MPHB\Views\BookingView::generatePriceBreakdownArray().
 * @param array  $breakdown The breakdown array that produced it.
 * @param bool   $forEmail  Skip screen-reader-only text (email clients would show it).
 */
function acs_discount_decorate_html( $html, $breakdown, $forEmail = false ) {
	if ( empty( $breakdown['acs_stay_discount']['rooms'] ) || false === strpos( (string) $html, 'mphb-price-breakdown' ) || ! class_exists( 'DOMDocument' ) ) {
		return $html;
	}
	$info  = $breakdown['acs_stay_discount'];
	$first = reset( $info['rooms'] );

	// libxml only knows HTML4 entities; MotoPress uses HTML5 ones like &plus;. Make them numeric.
	$html = preg_replace_callback( '/&([a-zA-Z][a-zA-Z0-9]*);/', function ( $m ) {
		if ( in_array( strtolower( $m[1] ), array( 'amp', 'lt', 'gt', 'quot', 'apos' ), true ) ) {
			return $m[0];
		}
		$char = html_entity_decode( $m[0], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		return ( $char !== $m[0] && 1 === mb_strlen( $char, 'UTF-8' ) ) ? '&#' . mb_ord( $char, 'UTF-8' ) . ';' : $m[0];
	}, (string) $html );

	$previous = libxml_use_internal_errors( true );
	$doc      = new DOMDocument();
	$loaded   = $doc->loadHTML( '<?xml encoding="utf-8" ?><div id="acs-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );
	if ( ! $loaded ) {
		return $html;
	}
	$xpath = new DOMXPath( $doc );
	$root  = $xpath->query( '//*[@id="acs-root"]' )->item( 0 );
	$table = $xpath->query( '//table[contains(concat(" ", normalize-space(@class), " "), " mphb-price-breakdown ")]' )->item( 0 );
	if ( ! $root || ! $table ) {
		return $html;
	}
	$hasClass = function ( $node, $class ) {
		return false !== strpos( ' ' . $node->getAttribute( 'class' ) . ' ', ' ' . $class . ' ' );
	};

	// 1. Badge, as a caption so it survives MotoPress replacing the table after AJAX.
	$caption = $doc->createElement( 'caption' );
	$caption->setAttribute( 'class', 'acs-discount-badge' );
	$caption->setAttribute( 'style', 'caption-side:top;text-align:left;font-weight:600;color:#1b5e20;background:#e8f5e9;padding:8px 12px;border-radius:6px;' );
	$caption->appendChild( $doc->createTextNode( sprintf( "\u{2713} %s discount applied: %d%% off every night", $first['label'], $first['pct'] ) ) );
	$table->insertBefore( $caption, $table->firstChild );

	// 2 + 3. Per-night crossed-out prices, then the two rows above "Dates Subtotal".
	$roomIndex = -1;
	$dates     = array();
	$dateIndex = 0;
	foreach ( iterator_to_array( $xpath->query( './tbody/tr', $table ) ) as $tr ) {
		if ( $hasClass( $tr, 'mphb-price-breakdown-booking' ) ) {
			$roomIndex++;
			$dateIndex = 0;
			$dates     = isset( $breakdown['rooms'][ $roomIndex ]['room']['list'] ) ? array_keys( $breakdown['rooms'][ $roomIndex ]['room']['list'] ) : array();
			continue;
		}
		if ( ! isset( $info['rooms'][ $roomIndex ] ) ) {
			continue;
		}
		$room = $info['rooms'][ $roomIndex ];

		if ( $hasClass( $tr, 'mphb-price-breakdown-date' ) ) {
			$date = isset( $dates[ $dateIndex ] ) ? $dates[ $dateIndex ] : null;
			$dateIndex++;
			$cell = $xpath->query( './td[contains(@class, "mphb-table-price-column")]', $tr )->item( 0 );
			if ( null === $date || ! $cell ) {
				continue;
			}
			$base    = $room['base'][ $date ];
			$charged = (float) $breakdown['rooms'][ $roomIndex ]['room']['list'][ $date ];
			if ( $base - $charged < 0.005 ) {
				continue;
			}
			$was = $doc->createElement( 's' );
			$was->setAttribute( 'class', 'acs-was' );
			$was->setAttribute( 'aria-hidden', 'true' );
			$was->setAttribute( 'style', 'color:#888;margin-right:6px;' );
			$was->appendChild( $doc->createTextNode( acs_money_text( $base ) ) );
			$cell->insertBefore( $was, $cell->firstChild );
			if ( ! $forEmail ) {
				$sr = $doc->createElement( 'span' );
				$sr->setAttribute( 'class', 'screen-reader-text acs-sr' );
				$sr->appendChild( $doc->createTextNode( sprintf( 'was %s, now ', acs_money_text( $base ) ) ) );
				$cell->insertBefore( $sr, $was->nextSibling );
			}
			continue;
		}

		if ( $hasClass( $tr, 'mphb-price-breakdown-dates-subtotal' ) ) {
			$fold    = $hasClass( $tr, 'mphb-hide' ) ? 'mphb-hide ' : '';
			$labelEl = $xpath->query( './th', $tr )->item( 0 );
			$colspan = $labelEl ? $labelEl->getAttribute( 'colspan' ) : '1';
			$rows    = array(
				array( 'acs-price-breakdown-before-discount', 'Nightly rate before discount', acs_money_text( $room['base_total'] ), '', 'acs-before-amount' ),
				array( 'acs-price-breakdown-stay-discount', sprintf( '%s discount (%d%%)', $room['label'], $room['pct'] ), "\u{2212}" . acs_money_text( $room['discount'] ), 'color:#2e7d32;', 'acs-discount-amount' ),
			);
			foreach ( $rows as $row ) {
				$newTr = $doc->createElement( 'tr' );
				$newTr->setAttribute( 'class', $fold . $row[0] );
				$th = $doc->createElement( 'th' );
				$th->setAttribute( 'colspan', $colspan ?: '1' );
				$th->appendChild( $doc->createTextNode( $row[1] ) );
				$amount = $doc->createElement( 'th' );
				$amount->setAttribute( 'class', 'mphb-table-price-column' );
				$span = $doc->createElement( 'span' );
				$span->setAttribute( 'class', $row[4] );
				if ( $row[3] ) {
					$span->setAttribute( 'style', $row[3] );
				}
				$span->appendChild( $doc->createTextNode( $row[2] ) );
				$amount->appendChild( $span );
				$newTr->appendChild( $th );
				$newTr->appendChild( $amount );
				$tr->parentNode->insertBefore( $newTr, $tr );
			}
		}
	}

	// 4. Savings line under the Total (weekly/monthly discount + coupon, if any).
	$totalRow = $xpath->query( './tfoot/tr[contains(concat(" ", normalize-space(@class), " "), " mphb-price-breakdown-total ")]', $table )->item( 0 );
	if ( $totalRow ) {
		$span = 0;
		foreach ( $totalRow->childNodes as $cellNode ) {
			if ( XML_ELEMENT_NODE === $cellNode->nodeType ) {
				$span += max( 1, (int) $cellNode->getAttribute( 'colspan' ) );
			}
		}
		$coupon = ( ! empty( $breakdown['coupon']['discount'] ) && $breakdown['coupon']['discount'] > 0 ) ? (float) $breakdown['coupon']['discount'] : 0.0;
		$label  = strtolower( $first['label'] );
		$text   = $coupon > 0
			? sprintf( "You're saving %s with your %s discount and coupon %s.", acs_money_text( $info['discount'] + $coupon ), $label, isset( $breakdown['coupon']['code'] ) ? $breakdown['coupon']['code'] : '' )
			: sprintf( "You're saving %s with your %s discount.", acs_money_text( $info['discount'] ), $label );
		$tr = $doc->createElement( 'tr' );
		$tr->setAttribute( 'class', 'acs-savings-row' );
		$td = $doc->createElement( 'td' );
		$td->setAttribute( 'colspan', (string) max( 1, $span ) );
		$td->setAttribute( 'style', 'color:#1b5e20;font-weight:600;text-align:left;' );
		$td->appendChild( $doc->createTextNode( $text ) );
		$tr->appendChild( $td );
		$totalRow->parentNode->insertBefore( $tr, $totalRow->nextSibling );
	}

	$out = '';
	foreach ( $root->childNodes as $child ) {
		$out .= $doc->saveHTML( $child );
	}
	return $out;
}

// Checkout page: the breakdown is printed by MotoPress at priority 30 of this action.
add_action( 'mphb_sc_checkout_form', function () {
	if ( acs_config()['discount_display'] ) {
		ob_start();
	}
}, 29 );
add_action( 'mphb_sc_checkout_form', function ( $booking ) {
	if ( ! acs_config()['discount_display'] ) {
		return;
	}
	$html      = ob_get_clean();
	$breakdown = ( is_object( $booking ) && method_exists( $booking, 'getLastPriceBreakdown' ) ) ? $booking->getLastPriceBreakdown( false ) : array();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo acs_discount_decorate_html( $html, $breakdown );
}, 31 );

// AJAX re-renders (guest count, services, coupon): decorate the JSON MotoPress sends back.
function acs_discount_ajax_filter( $output ) {
	$json = json_decode( $output, true );
	if ( ! is_array( $json ) || empty( $json['success'] ) || empty( $json['data']['priceBreakdown'] ) || empty( $GLOBALS['acs_last_price_breakdown'] ) ) {
		return $output;
	}
	$json['data']['priceBreakdown'] = acs_discount_decorate_html( $json['data']['priceBreakdown'], $GLOBALS['acs_last_price_breakdown'] );
	$encoded = wp_json_encode( $json );
	return $encoded ? $encoded : $output;
}
foreach ( array( 'mphb_update_checkout_info', 'mphb_apply_coupon' ) as $acs_ajax_action ) {
	foreach ( array( 'wp_ajax_', 'wp_ajax_nopriv_' ) as $acs_ajax_prefix ) {
		add_action( $acs_ajax_prefix . $acs_ajax_action, function () {
			if ( acs_config()['discount_display'] ) {
				ob_start( 'acs_discount_ajax_filter' );
			}
		}, 0 );
	}
}
unset( $acs_ajax_action, $acs_ajax_prefix );

// Booking emails: %price_breakdown% uses the breakdown saved with the booking.
add_filter( 'mphb_email_replace_tag', function ( $text, $tag, $booking ) {
	if ( 'price_breakdown' !== $tag || ! acs_config()['discount_display'] || ! is_object( $booking ) || ! method_exists( $booking, 'getLastPriceBreakdown' ) ) {
		return $text;
	}
	return acs_discount_decorate_html( $text, $booking->getLastPriceBreakdown(), true );
}, 20, 3 );

add_action( 'wp_head', function () {
	if ( ! acs_config()['discount_display'] || ! function_exists( 'mphb_is_checkout_page' ) || ! mphb_is_checkout_page() ) {
		return;
	}
	?>
	<style id="acs-discount-css">
		.mphb-price-breakdown caption.acs-discount-badge{caption-side:top;text-align:left;font-weight:600;color:#1b5e20;background:#e8f5e9;padding:10px 14px;border-radius:8px;margin-bottom:10px}
		.mphb-price-breakdown .acs-was{color:#888;margin-right:6px;font-weight:400}
		.mphb-price-breakdown .acs-discount-amount{color:#2e7d32}
		.mphb-price-breakdown .acs-savings-row td{color:#1b5e20;font-weight:600;text-align:left}
		.acs-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
		.acs-back-to-results{display:inline-block;margin:0 0 16px;font-weight:600}
	</style>
	<?php
} );

/* -------------------------------------------------------------------------
 * 17. Search results → checkout
 * Results with dates: Book Now posts the same fields as the listing's own direct-booking form to
 * checkout (see templates/city-search/room-card.php). If the dates stopped working in between, the
 * guest lands on the listing with the dates prefilled and a clear message instead of an error.
 * ---------------------------------------------------------------------- */

function acs_render_book_now_form( $roomType, \DateTime $checkIn, \DateTime $checkOut, $adults, $children ) {
	$typeId   = $roomType->getOriginalId();
	$format   = MPHB()->settings()->dateTime()->getDateTransferFormat();
	$action   = MPHB()->settings()->pages()->getCheckoutPageUrl();
	$scheme   = is_ssl() ? 'https://' : 'http://';
	$current  = isset( $_SERVER['HTTP_HOST'], $_SERVER['REQUEST_URI'] ) ? esc_url_raw( $scheme . wp_unslash( $_SERVER['HTTP_HOST'] ) . wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	$fields   = array(
		'mphb_room_type_id'                      => $typeId,
		'mphb_check_in_date'                     => $checkIn->format( $format ),
		'mphb_check_out_date'                    => $checkOut->format( $format ),
		'mphb_adults'                            => (int) $adults,
		'mphb_children'                          => (int) $children,
		'mphb_rooms_details[' . $typeId . ']'    => 1,
		'mphb_is_direct_booking'                 => 1,
		'acs_from_results'                       => 1,
		'acs_back'                               => $current,
	);
	?>
	<form method="POST" action="<?php echo esc_url( $action ); ?>" class="acs-booknow-form">
		<?php
		wp_nonce_field( \MPHB\Shortcodes\CheckoutShortcode::NONCE_ACTION_CHECKOUT, \MPHB\Shortcodes\CheckoutShortcode::NONCE_NAME, false );
		foreach ( mphb_get_query_args( $action ) as $name => $value ) {
			printf( '<input type="hidden" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $value ) );
		}
		foreach ( $fields as $name => $value ) {
			printf( '<input type="hidden" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $value ) );
		}
		?>
		<button type="submit" class="mphb-air-booknow"><?php esc_html_e( 'Book Now', 'acs-site' ); ?></button>
	</form>
	<?php
}

/**
 * The undiscounted total for a results card (7+ nights), from the same rate MotoPress quoted.
 * Returns null unless our own sum matches MotoPress's price to the cent, so the card can never
 * show a comparison that disagrees with the real quote.
 */
function acs_room_type_stay_discount( $roomType, \DateTime $checkIn, \DateTime $checkOut, $adults, $children, $periodPrice ) {
	if ( ! acs_config()['discount_display'] || \MPHB\Utils\DateUtils::calcNights( $checkIn, $checkOut ) < 7 ) {
		return null;
	}
	$request = MPHB()->reservationRequest();
	$saved   = $request->getParameters();
	$result  = null;
	try {
		$request->setupParameters( array(
			'adults'         => (int) $adults,
			'children'       => (int) $children,
			'check_in_date'  => $checkIn,
			'check_out_date' => $checkOut,
		) );
		$rates = MPHB()->getRateRepository()->findAllActiveByRoomType( $roomType->getOriginalId(), array( 'check_in_date' => $checkIn, 'check_out_date' => $checkOut ) );
		foreach ( (array) $rates as $rate ) {
			$charged = $rate->getPriceBreakdown( $checkIn, $checkOut );
			if ( abs( array_sum( $charged ) - (float) $periodPrice ) >= 0.01 ) {
				continue;
			}
			$result = acs_stay_discount_info( $charged, acs_base_prices_for_rate( $rate ) );
			break;
		}
	} catch ( \Throwable $e ) {
		$result = null;
	}
	$request->resetDefaults();
	$request->setupParameters( $saved );
	return $result;
}

// Before MotoPress sets up checkout (priority 10): if Book Now's dates no longer work, go back
// to the listing with the dates prefilled and a message.
add_action( 'wp', function () {
	if ( empty( $_POST['acs_from_results'] ) || ! acs_config()['results_checkout'] || ! function_exists( 'mphb_is_checkout_page' ) || ! mphb_is_checkout_page() ) {
		return;
	}
	$format   = MPHB()->settings()->dateTime()->getDateTransferFormat();
	$typeId   = isset( $_POST['mphb_room_type_id'] ) ? absint( $_POST['mphb_room_type_id'] ) : 0;
	$checkIn  = isset( $_POST['mphb_check_in_date'] ) ? \DateTime::createFromFormat( $format, sanitize_text_field( wp_unslash( $_POST['mphb_check_in_date'] ) ) ) : false;
	$checkOut = isset( $_POST['mphb_check_out_date'] ) ? \DateTime::createFromFormat( $format, sanitize_text_field( wp_unslash( $_POST['mphb_check_out_date'] ) ) ) : false;
	$roomType = $typeId ? MPHB()->getRoomTypeRepository()->findById( $typeId ) : null;

	$problem = '';
	if ( ! $roomType || ! $checkIn || ! $checkOut || $checkOut <= $checkIn ) {
		$problem = 'unavailable';
	} elseif ( ! MPHB()->getRulesChecker()->verify( $checkIn, $checkOut, $typeId ) ) {
		$problem = 'rules';
	} else {
		$unavailable = MPHB()->getRulesChecker()->customRules()->getUnavailableRooms( $checkIn, $checkOut, $roomType->getOriginalId() );
		$free        = MPHB()->getRoomPersistence()->isExistsRooms( $checkIn, $checkOut, array(
			'count'             => 1,
			'room_type_id'      => $roomType->getOriginalId(),
			'exclude_rooms'     => $unavailable,
			'skip_buffer_rules' => false,
		) );
		$rates = MPHB()->getRateRepository()->findAllActiveByRoomType( $roomType->getId(), array( 'check_in_date' => $checkIn, 'check_out_date' => $checkOut ) );
		if ( ! $free || empty( $rates ) ) {
			$problem = 'unavailable';
		}
	}
	if ( ! $problem ) {
		return;
	}
	$target = $roomType && $checkIn && $checkOut
		? acs_listing_url_with_dates( $roomType, $checkIn, $checkOut, isset( $_POST['mphb_adults'] ) ? absint( $_POST['mphb_adults'] ) : '', isset( $_POST['mphb_children'] ) ? absint( $_POST['mphb_children'] ) : '' )
		: home_url( '/' );
	wp_safe_redirect( add_query_arg( 'acs_notice', $problem, $target ) );
	exit;
}, 5 );

// Checkout: preselect the guest count the search captured (display only; MotoPress reprices on change).
add_filter( 'mphb_sc_checkout_preset_adults', function ( $value ) {
	return ( ! empty( $_POST['acs_from_results'] ) && isset( $_POST['mphb_adults'] ) ) ? absint( $_POST['mphb_adults'] ) : $value;
} );
add_filter( 'mphb_sc_checkout_preset_children', function ( $value ) {
	return ( ! empty( $_POST['acs_from_results'] ) && isset( $_POST['mphb_children'] ) ) ? absint( $_POST['mphb_children'] ) : $value;
} );

// Checkout: a way back to the same filtered results (the browser Back button works too).
add_action( 'mphb_sc_checkout_before_form', function () {
	if ( empty( $_POST['acs_back'] ) ) {
		return;
	}
	$back = wp_validate_redirect( esc_url_raw( wp_unslash( $_POST['acs_back'] ) ), '' );
	if ( $back ) {
		printf( '<a class="acs-back-to-results" href="%s">&larr; %s</a>', esc_url( $back ), esc_html__( 'Back to search results', 'acs-site' ) );
	}
}, 5 );

// Listing pages opened from results ("View details" or the fallback above): remember the dates
// so MotoPress's booking form comes up prefilled.
add_action( 'wp', function () {
	if ( empty( $_GET['acs_prefill'] ) || empty( $_GET['mphb_check_in_date'] ) || empty( $_GET['mphb_check_out_date'] ) || ! function_exists( 'MPHB' ) ) {
		return;
	}
	MPHB()->searchParametersStorage()->save( array(
		'mphb_check_in_date'  => sanitize_text_field( wp_unslash( $_GET['mphb_check_in_date'] ) ),
		'mphb_check_out_date' => sanitize_text_field( wp_unslash( $_GET['mphb_check_out_date'] ) ),
		'mphb_adults'         => isset( $_GET['mphb_adults'] ) ? absint( $_GET['mphb_adults'] ) : '',
		'mphb_children'       => isset( $_GET['mphb_children'] ) ? absint( $_GET['mphb_children'] ) : '',
	) );
}, 5 );

// The message on the listing page, placed right above the booking form.
add_action( 'wp_footer', function () {
	$notice = isset( $_GET['acs_notice'] ) ? sanitize_key( $_GET['acs_notice'] ) : '';
	$messages = array(
		'unavailable' => 'Those dates just became unavailable. Pick new dates or see other homes.',
		'rules'       => "Those dates don't meet this home's booking rules (for example, the minimum stay). Pick new dates or see other homes.",
	);
	if ( ! isset( $messages[ $notice ] ) ) {
		return;
	}
	?>
	<div id="acs-book-notice" class="acs-book-notice" role="alert" style="background:#fff4e5;border:1px solid #f0b86e;color:#5f3b00;padding:12px 16px;border-radius:8px;margin:0 0 16px;font-weight:600;">
		<?php echo esc_html( $messages[ $notice ] ); ?>
		<a href="<?php echo esc_url( home_url( '/listings/' ) ); ?>" style="margin-left:6px;"><?php esc_html_e( 'See other homes', 'acs-site' ); ?></a>
	</div>
	<script>
	(function () {
		var n = document.getElementById('acs-book-notice'), f = document.querySelector('form.mphb-booking-form');
		if (f && f.parentNode) { f.parentNode.insertBefore(n, f); } else { n.style.position = 'fixed'; n.style.top = '16px'; n.style.left = '16px'; n.style.right = '16px'; n.style.zIndex = '9999'; }
	})();
	</script>
	<?php
} );

/* -------------------------------------------------------------------------
 * 18. Stays of 28+ nights: screening notice (display only)
 * Long stays stay bookable (the guest can pay to lock in dates and rate). Checkout shows a notice
 * that screening applies, with a "Message us" email link prefilled with the stay. Approved by
 * Andrew, Sep 28, 2026, together with the matching line in the refund policy.
 * ---------------------------------------------------------------------- */

/**
 * mailto: link prefilled with the stay. {guests} and {total} are filled in by JS on click,
 * so they reflect the current checkout (guest count, coupon).
 */
function acs_long_stay_mailto( $title, \DateTime $checkIn, \DateTime $checkOut, $nights ) {
	$format  = get_option( 'date_format' );
	$subject = sprintf( 'Stay of %d nights: %s', $nights, $title );
	$body    = sprintf(
		"Hi Andrew and Vivian,\n\nI'm interested in a longer stay:\nProperty: %s\nCheck-in: %s\nCheck-out: %s (%d nights)\nGuests: {guests}\nTotal shown: {total}\n\n",
		$title,
		date_i18n( $format, $checkIn->getTimestamp() ),
		date_i18n( $format, $checkOut->getTimestamp() ),
		$nights
	);
	return 'mailto:' . acs_config()['contact_email'] . '?subject=' . rawurlencode( $subject ) . '&body=' . rawurlencode( $body );
}

/** @return array|null [ 'nights', 'href' ] for a checkout booking of 28+ nights. */
function acs_long_stay_for_booking( $booking ) {
	$cfg = acs_config();
	if ( ! $cfg['long_stay_notice'] || ! is_object( $booking ) || ! method_exists( $booking, 'getCheckInDate' ) ) {
		return null;
	}
	$checkIn  = $booking->getCheckInDate();
	$checkOut = $booking->getCheckOutDate();
	if ( ! $checkIn || ! $checkOut ) {
		return null;
	}
	$nights = \MPHB\Utils\DateUtils::calcNights( $checkIn, $checkOut );
	if ( $nights < $cfg['long_stay_nights'] ) {
		return null;
	}
	$titles = array();
	foreach ( (array) $booking->getReservedRooms() as $room ) {
		$type = MPHB()->getRoomTypeRepository()->findById( $room->getRoomTypeId() );
		if ( $type ) {
			$titles[] = $type->getTitle();
		}
	}
	return array(
		'nights' => $nights,
		'href'   => acs_long_stay_mailto( implode( ', ', $titles ), $checkIn, $checkOut, $nights ),
	);
}

// Full notice above the price breakdown (the breakdown prints at priority 30).
add_action( 'mphb_sc_checkout_form', function ( $booking ) {
	$stay = acs_long_stay_for_booking( $booking );
	if ( ! $stay ) {
		return;
	}
	?>
	<div class="acs-long-stay-notice" role="note" style="background:#fff8e6;border:1px solid #e8c77a;border-radius:8px;padding:14px 16px;margin:0 0 18px;">
		<p style="margin:0 0 6px;"><strong><?php echo esc_html( sprintf( 'Staying %d nights or more? Talk to us before you book.', acs_config()['long_stay_nights'] ) ); ?></strong></p>
		<p style="margin:0 0 8px;">Longer stays need a quick screening: a credit and background check and a reference from a prior landlord, depending on your location. You can book now to lock in these dates and this rate. We'll contact you within 24 hours to finish screening. If we can't approve your stay, you'll get a full refund. Security deposit and first month are due at signing.</p>
		<p style="margin:0;"><a class="acs-long-stay-message" href="<?php echo esc_attr( $stay['href'] ); ?>" style="font-weight:600;">Message us about this stay</a> &middot; or call <a href="tel:+12053417045">+1 (205) 341-7045</a></p>
	</div>
	<?php
}, 25 );

// Short reminder just above the terms and the final button.
add_action( 'mphb_sc_checkout_form', function ( $booking ) {
	$stay = acs_long_stay_for_booking( $booking );
	if ( ! $stay ) {
		return;
	}
	printf(
		'<p class="acs-long-stay-short" style="background:#fff8e6;border-radius:6px;padding:10px 12px;">%s <a class="acs-long-stay-message" href="%s" style="font-weight:600;">%s</a></p>',
		esc_html( sprintf( 'Stays of %d+ nights are subject to screening. We\'ll contact you within 24 hours; full refund if we can\'t approve your stay.', acs_config()['long_stay_nights'] ) ),
		esc_attr( $stay['href'] ),
		esc_html__( 'Message us about this stay', 'acs-site' )
	);
}, 59 );

// Fill {guests} and {total} into the email when the link is clicked.
add_action( 'wp_footer', function () {
	if ( ! acs_config()['long_stay_notice'] || ! function_exists( 'mphb_is_checkout_page' ) || ! mphb_is_checkout_page() ) {
		return;
	}
	?>
	<script>
	document.addEventListener('click', function (e) {
		var a = e.target.closest && e.target.closest('a.acs-long-stay-message');
		if (!a) { return; }
		if (!a.dataset.acsBase) { a.dataset.acsBase = a.getAttribute('href'); }
		var adults = document.querySelector('select[name*="[adults]"]'), kids = document.querySelector('select[name*="[children]"]');
		var guests = (adults && adults.value ? parseInt(adults.value, 10) : 0) + (kids && kids.value ? parseInt(kids.value, 10) : 0);
		var totalEl = document.querySelector('.mphb-price-breakdown-total .mphb-table-price-column');
		var total = totalEl ? totalEl.textContent.replace(/\s+/g, ' ').trim() : 'see checkout';
		a.setAttribute('href', a.dataset.acsBase.replace('%7Bguests%7D', encodeURIComponent(guests ? String(guests) : 'not selected yet')).replace('%7Btotal%7D', encodeURIComponent(total)));
	}, true);
	</script>
	<?php
}, 40 );
