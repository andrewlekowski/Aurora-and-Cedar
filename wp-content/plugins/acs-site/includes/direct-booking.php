<?php
/**
 * ACS Site: direct-booking pricing, whole-house linking, cleaning fees and referral codes.
 *
 * Everything you change lives in acs_direct_config() at the top of this file:
 *   - DIRECT_DISCOUNT: direct nightly = Airbnb nightly × (1 − DIRECT_DISCOUNT), rounded to whole dollars.
 *   - listings: Airbnb nightly rates per month (Sun–Thu, Fri–Sat), date overrides, cleaning/pet fees.
 *   - families: a whole-house listing and its suites. Booking one blocks the other(s) right away.
 *   - coupons: referral codes (10% off the nightly total, 2+ nights, no stacking).
 * After editing prices or coupons: WP admin → Tools → Direct Pricing → "Apply rates" / "Sync coupons".
 *
 * Listings are found by their Accommodation Type slug, so drafts work before publishing.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function acs_direct_config() {
	// [Sun–Thu, Fri–Sat] Airbnb nightly rates BEFORE the direct discount. Month 6 = Jun ... (Jun–Aug share a rate).
	$whole = array(
		1 => array( 250, 268 ), 2 => array( 300, 321 ), 3 => array( 300, 321 ), 4 => array( 240, 257 ),
		5 => array( 290, 310 ), 6 => array( 345, 369 ), 7 => array( 345, 369 ), 8 => array( 345, 369 ),
		9 => array( 310, 332 ), 10 => array( 275, 294 ), 11 => array( 240, 257 ), 12 => array( 260, 281 ),
	);
	$moose = array(
		1 => array( 135, 144 ), 2 => array( 143, 153 ), 3 => array( 152, 163 ), 4 => array( 144, 154 ),
		5 => array( 172, 184 ), 6 => array( 207, 221 ), 7 => array( 207, 221 ), 8 => array( 207, 221 ),
		9 => array( 186, 199 ), 10 => array( 161, 172 ), 11 => array( 137, 147 ), 12 => array( 144, 154 ),
	);
	return apply_filters( 'acs_direct_config', array(
		'DIRECT_DISCOUNT' => 0.10,
		'months_ahead'    => 18, // how far ahead "Apply rates" writes monthly seasons
		'listings'        => array(
			'moose-and-bear-lodge' => array(
				'name'             => 'Moose & Bear Lodge',
				'airbnb'           => $whole,
				// Date overrides (Airbnb holiday/event prices), applied before the monthly table:
				// array( 'from' => '2026-11-25', 'to' => '2026-11-29', 'airbnb' => array( 300, 320 ), 'label' => 'Thanksgiving' ),
				'overrides'        => array(),
				'cleaning_fee'     => 180,
				'pet_fee_per_stay' => 75,
			),
			'moose-lodge'          => array(
				'name'             => 'Moose Lodge',
				'airbnb'           => $moose,
				'overrides'        => array(),
				'cleaning_fee'     => 100,
				'pet_fee_per_stay' => 75,
			),
			// Bear Den keeps its own MotoPress rate (already the discounted direct price): badge only.
			'rental-unit-in-fairbanks' => array(
				'name'         => 'Bear Den',
				'manual_rates' => true,
			),
		),
		// Whole house => suites. A booking on any one blocks the overlapping nights on the others.
		'families'        => array(
			'moose-and-bear-lodge' => array( 'moose-lodge', 'rental-unit-in-fairbanks' ),
		),
		// Referral / influencer codes. pct = share of the NIGHTLY total. expires = 'Y-m-d' or ''.
		'coupons'         => array(
			array( 'code' => 'AURORA10', 'pct' => 0.10, 'partner' => 'Aurora & Cedar', 'expires' => '' ),
			array( 'code' => 'VIVIAN10', 'pct' => 0.10, 'partner' => 'Vivian', 'expires' => '' ),
		),
		'coupon_min_nights' => 2,
		'commission_pct'    => 0.10, // partner payout = this × nightly total (CSV export)
		'ref_cookie_days'   => 30,
	) );
}

/* ---------------------------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------------------------- */

/** Accommodation Type post ID for a slug (any status), cached per request. */
function acs_direct_type_id( $slug ) {
	static $cache = array();
	if ( ! isset( $cache[ $slug ] ) ) {
		$posts           = get_posts( array( 'post_type' => 'mphb_room_type', 'name' => $slug, 'post_status' => array( 'publish', 'draft', 'pending', 'private' ), 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true ) );
		$cache[ $slug ] = $posts ? (int) $posts[0] : 0;
	}
	return $cache[ $slug ];
}

/** Listing config for an Accommodation Type ID, or null. */
function acs_direct_listing_for_type( $typeId ) {
	$typeId = (int) $typeId;
	foreach ( acs_direct_config()['listings'] as $slug => $l ) {
		if ( $typeId && acs_direct_type_id( $slug ) === $typeId ) {
			return $l + array( 'slug' => $slug );
		}
	}
	return null;
}

/** Direct price from an Airbnb price. */
function acs_direct_price( $airbnb ) {
	return (int) round( (float) $airbnb * ( 1 - (float) acs_direct_config()['DIRECT_DISCOUNT'] ) );
}

/** Accommodation (room) IDs of a type. */
function acs_direct_room_ids( $typeId ) {
	return get_posts( array( 'post_type' => 'mphb_room', 'post_status' => array( 'publish', 'draft' ), 'numberposts' => -1, 'fields' => 'ids',
		'meta_query' => array( array( 'key' => 'mphb_room_type_id', 'value' => (int) $typeId ) ), 'suppress_filters' => true ) );
}

/** Room type of the (first) reserved room of a booking. */
function acs_direct_booking_type_id( $booking ) {
	if ( ! is_object( $booking ) || ! method_exists( $booking, 'getReservedRooms' ) ) {
		return 0;
	}
	foreach ( (array) $booking->getReservedRooms() as $rr ) {
		return (int) $rr->getRoomTypeId();
	}
	return 0;
}

/* ---------------------------------------------------------------------------------------------
 * 21. Whole house <-> suites: instant blocking
 * MotoPress 4.6 has no "linked rooms". We add virtual Booking Rules ("not stay-in") for the
 * overlapping nights of every live booking in the family. MotoPress enforces Booking Rules in the
 * calendar, search and at checkout. The rules are added when MotoPress reads the option, never saved:
 * on the Booking Rules screen itself (where the option is edited and saved) they are left out.
 * ------------------------------------------------------------------------------------------- */

/**
 * Does this booking hold a guest (and so block its relatives)? Website bookings: yes. Imported calendar events:
 * Airbnb "Reserved" and Vrbo "Reserved - Name" yes; Airbnb "Not available", Vrbo "Blocked" and website
 * "Blocked: ..." are placeholders — Airbnb puts one on the whole house for every suite stay, so counting them
 * would block Moose Lodge whenever Bear Den is booked. Booking.com marks bookings and closed dates alike as
 * "CLOSED - Not available", so those count (safer to over-block than double-book). Same rules as the ops app.
 */
function acs_direct_is_real_stay( $booking ) {
	if ( ! method_exists( $booking, 'isImported' ) || ! $booking->isImported() ) {
		return true;
	}
	// MotoPress keeps the summary wrapped in quotes ("Reserved"), so strip quotes as well as spaces.
	$s = strtolower( trim( (string) ( method_exists( $booking, 'getICalSummary' ) ? $booking->getICalSummary() : '' ), " \t\n\r\"'" ) );
	$p = strtolower( (string) ( method_exists( $booking, 'getICalProdid' ) ? $booking->getICalProdid() : '' ) );
	if ( 0 === strpos( $s, 'reserved' ) ) {
		return true; // Airbnb "Reserved", Vrbo "Reserved - Name"
	}
	if ( false !== strpos( $s, 'closed' ) || false !== strpos( $p, 'booking.com' ) ) {
		return true; // Booking.com: can't tell a booking from a closed date
	}
	return false; // "Airbnb (Not available)", Vrbo "Blocked", "Blocked: booked as ..."
}

function acs_direct_family_rules() {
	// Built fresh for each request (cached only within it). A longer cache went stale: MotoPress reads the
	// rules in the middle of a calendar import, before the import has finished saving bookings.
	if ( isset( $GLOBALS['acs_family_rules_cache'] ) && is_array( $GLOBALS['acs_family_rules_cache'] ) ) {
		return $GLOBALS['acs_family_rules_cache'];
	}
	$rules = array();
	if ( ! function_exists( 'MPHB' ) ) {
		return $rules;
	}
	$today = current_time( 'Y-m-d' );
	foreach ( acs_direct_config()['families'] as $wholeSlug => $suiteSlugs ) {
		$whole  = acs_direct_type_id( $wholeSlug );
		$suites = array_filter( array_map( 'acs_direct_type_id', $suiteSlugs ) );
		if ( ! $whole || ! $suites ) {
			continue;
		}
		// Which types each member blocks: whole -> every suite; a suite -> the whole house.
		$blocks = array( $whole => $suites );
		foreach ( $suites as $s ) {
			$blocks[ $s ] = array( $whole );
		}
		foreach ( $blocks as $sourceType => $targets ) {
			if ( 'publish' !== get_post_status( $sourceType ) ) {
				continue; // drafts take no bookings
			}
			$roomIds = acs_direct_room_ids( $sourceType );
			if ( ! $roomIds ) {
				continue;
			}
			// Website bookings (room-locking statuses) AND bookings imported from Airbnb/Vrbo/Booking.com
			// calendars. Each listing imports only its own channel calendars (importing one calendar into
			// two listings makes MotoPress delete the other listing's copy as "outdated"), so the family
			// blocking below is what keeps the whole house and the suites from overlapping.
			$range    = array(
				'rooms'     => $roomIds,
				'date_from' => $today,
				'date_to'   => gmdate( 'Y-m-d', strtotime( $today . ' +3 years' ) ),
			);
			$bookings = array();
			foreach ( array( array( 'room_locked' => true ), array( 'post_status' => array( 'imported' ) ) ) as $extraArgs ) {
				try {
					foreach ( (array) MPHB()->getBookingRepository()->findAll( $range + $extraArgs ) as $b ) {
						$bookings[ $b->getId() ] = $b;
					}
				} catch ( \Throwable $e ) {
					continue;
				}
			}
			foreach ( $bookings as $b ) {
				if ( ! acs_direct_is_real_stay( $b ) ) {
					continue; // a channel's own "not available" placeholder, not a guest
				}
				$in  = $b->getCheckInDate();
				$out = clone $b->getCheckOutDate();
				$out->modify( '-1 day' ); // last night
				if ( $out < $in ) {
					continue;
				}
				foreach ( $targets as $t ) {
					$rules[] = array(
						'room_type_id' => (int) $t,
						'room_id'      => 0,
						'date_from'    => $in->format( 'Y-m-d' ),
						'date_to'      => $out->format( 'Y-m-d' ),
						'restrictions' => array( 'stay-in' ),
						'comment'      => sprintf( 'Blocked: booked as %s (#%d)', get_the_title( $sourceType ), $b->getId() ),
					);
				}
			}
		}
	}
	$GLOBALS['acs_family_rules_cache'] = $rules;
	return $rules;
}

// Rebuild the family blocks as soon as any booking is created, imported, changed or removed.
$acs_family_flush = function ( $postId = 0 ) {
	if ( ! $postId || 'mphb_booking' === get_post_type( $postId ) ) {
		unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
	}
};
add_action( 'save_post_mphb_booking', $acs_family_flush );
add_action( 'before_delete_post', $acs_family_flush );
add_action( 'trashed_post', $acs_family_flush );
add_action( 'mphb_booking_status_changed', function () {
	unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
} );

add_filter( 'option_mphb_booking_rules_custom', function ( $value ) {
	if ( is_admin() && isset( $_GET['page'] ) && 'mphb_booking_rules' === $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification
		return $value; // the screen that edits and saves this option: real rules only
	}
	if ( is_admin() && ! empty( $_POST['option_page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return $value;
	}
	static $busy = false;
	if ( $busy ) {
		return $value; // never recurse while the rules are being built
	}
	$busy  = true;
	$extra = acs_direct_family_rules();
	$busy  = false;
	return $extra ? array_merge( (array) $value, $extra ) : $value;
} );

// Any booking change (new, status, iCal import, delete) refreshes the virtual rules.
foreach ( array( 'save_post_mphb_booking', 'mphb_create_booking_by_user', 'mphb_booking_confirmed', 'mphb_booking_cancelled', 'mphb_create_booking_via_ical' ) as $acs_hook ) {
	add_action( $acs_hook, function () {
		unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
	} );
}
add_action( 'before_delete_post', function ( $id ) {
	if ( 'mphb_booking' === get_post_type( $id ) ) {
		unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
	}
} );
add_action( 'transition_post_status', function ( $new, $old, $post ) {
	if ( $post && in_array( $post->post_type, array( 'mphb_booking', 'mphb_room_type' ), true ) && $new !== $old ) {
		unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
	}
}, 10, 3 );

/* ---------------------------------------------------------------------------------------------
 * 22. Cleaning fee (per stay) for configured listings
 * Added to MotoPress's total (so Stripe charges it) and shown as its own line in the breakdown.
 * Coupons only discount accommodation nights, so the fee is never discounted.
 * ------------------------------------------------------------------------------------------- */

function acs_direct_cleaning_fee( $booking ) {
	$l = acs_direct_listing_for_type( acs_direct_booking_type_id( $booking ) );
	return $l && ! empty( $l['cleaning_fee'] ) ? (float) $l['cleaning_fee'] : 0.0;
}

add_filter( 'mphb_booking_calculate_total_price', function ( $total, $booking = null ) {
	$fee = acs_direct_cleaning_fee( $booking );
	return $fee ? $total + $fee : $total;
}, 10, 2 );

add_filter( 'mphb_booking_price_breakdown', function ( $breakdown, $booking = null ) {
	$fee = acs_direct_cleaning_fee( $booking );
	// 'total' already includes the fee (MotoPress runs mphb_booking_calculate_total_price for it); just record it.
	if ( $fee && is_array( $breakdown ) ) {
		$breakdown['acs_cleaning_fee'] = $fee;
	}
	return $breakdown;
}, 5, 2 );

/** "Cleaning fee" row printed right above Total, wherever MotoPress renders a price breakdown
 *  (checkout + its AJAX re-renders, confirmation page, emails, admin). */
add_filter( 'mphb_get_taxes_breakdown', function ( $html, $priceBreakdown = array() ) {
	if ( empty( $priceBreakdown['acs_cleaning_fee'] ) ) {
		return $html;
	}
	return '<tr class="acs-cleaning-fee"><th colspan="1">Cleaning fee</th><td class="mphb-table-price-column">'
		. mphb_format_price( $priceBreakdown['acs_cleaning_fee'] ) . '</td></tr>' . $html;
}, 10, 2 );

/* ---------------------------------------------------------------------------------------------
 * 23. Pet fee wording per listing (the pet-fee plugin is site-wide: $X per pet per night)
 * ------------------------------------------------------------------------------------------- */

function acs_direct_checkout_type_id() {
	// Checkout POSTs carry mphb_room_details[...][room_type_id]; the listing page carries the type in the form.
	foreach ( array( $_POST, $_GET ) as $src ) { // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! empty( $src['mphb_room_details'] ) && is_array( $src['mphb_room_details'] ) ) {
			foreach ( $src['mphb_room_details'] as $d ) {
				if ( ! empty( $d['room_type_id'] ) ) {
					return (int) $d['room_type_id'];
				}
			}
		}
		if ( ! empty( $src['mphb_rooms_details'] ) && is_array( $src['mphb_rooms_details'] ) ) {
			foreach ( array_keys( $src['mphb_rooms_details'] ) as $tid ) {
				return (int) $tid;
			}
		}
	}
	return 0;
}

add_filter( 'option_mphb_pet_fee_options', function ( $opts ) {
	if ( is_admin() && ! wp_doing_ajax() ) {
		return $opts;
	}
	$l = acs_direct_listing_for_type( acs_direct_checkout_type_id() );
	if ( $l && ! empty( $l['pet_fee_per_stay'] ) ) {
		$fee                     = (int) $l['pet_fee_per_stay'];
		$opts                    = (array) $opts;
		$opts['per_night_fee']   = '0';
		$opts['message']         = sprintf( 'For guests traveling with pets, the pet fee for %s is $%d per pet per stay. The host will contact you after booking to collect it. Please review our <a href="/pet-policy/">Pet Policy</a>.', esc_html( $l['name'] ), $fee );
		$GLOBALS['acs_pet_per_stay'] = $fee;
	}
	return $opts;
} );

/* ---------------------------------------------------------------------------------------------
 * 24. Rates from the config ("Tools → Direct Pricing → Apply rates")
 * Writes one MotoPress Season per month and weekday group (Sun–Thu / Fri–Sat) plus one per override,
 * then sets the listing's Rate to those prices (top row = highest priority, so overrides go first).
 * ------------------------------------------------------------------------------------------- */

function acs_direct_season( $key, $title, $from, $to, $days ) {
	$found = get_posts( array( 'post_type' => 'mphb_season', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids',
		'meta_query' => array( array( 'key' => 'acs_direct_season', 'value' => $key ) ), 'suppress_filters' => true ) );
	$id = $found ? (int) $found[0] : wp_insert_post( array( 'post_type' => 'mphb_season', 'post_status' => 'publish', 'post_title' => $title ) );
	if ( ! $id || is_wp_error( $id ) ) {
		return 0;
	}
	wp_update_post( array( 'ID' => $id, 'post_title' => $title ) );
	update_post_meta( $id, 'acs_direct_season', $key );
	update_post_meta( $id, 'mphb_start_date', $from );
	update_post_meta( $id, 'mphb_end_date', $to );
	update_post_meta( $id, 'mphb_days', array_map( 'strval', $days ) );
	return $id;
}

/** @return array [ [ 'from','to','sun_thu','fri_sat','label' ] ] the direct prices that will be written */
function acs_direct_price_plan( $l ) {
	$cfg  = acs_direct_config();
	$plan = array();
	foreach ( (array) ( $l['overrides'] ?? array() ) as $o ) {
		$plan[] = array( 'from' => $o['from'], 'to' => $o['to'], 'sun_thu' => acs_direct_price( $o['airbnb'][0] ), 'fri_sat' => acs_direct_price( $o['airbnb'][1] ?? $o['airbnb'][0] ),
			'label' => $o['label'] ?? 'Override', 'override' => true );
	}
	$start = new DateTime( current_time( 'Y-m-01' ) );
	for ( $i = 0; $i < (int) $cfg['months_ahead']; $i++ ) {
		$m    = (clone $start)->modify( "+$i month" );
		$rate = $l['airbnb'][ (int) $m->format( 'n' ) ];
		$plan[] = array( 'from' => $m->format( 'Y-m-01' ), 'to' => $m->format( 'Y-m-t' ), 'sun_thu' => acs_direct_price( $rate[0] ), 'fri_sat' => acs_direct_price( $rate[1] ),
			'label' => $m->format( 'M Y' ), 'override' => false, 'airbnb' => $rate );
	}
	return $plan;
}

function acs_direct_apply_rates( $slug ) {
	$cfg = acs_direct_config();
	$l   = $cfg['listings'][ $slug ] ?? null;
	$tid = acs_direct_type_id( $slug );
	if ( ! $l || ! empty( $l['manual_rates'] ) || ! $tid ) {
		return new WP_Error( 'skip', "$slug: no Accommodation Type with this slug, or rates are managed by hand" );
	}
	$capacity = (int) get_post_meta( $tid, 'mphb_adults_capacity', true );
	$rows     = array();
	foreach ( acs_direct_price_plan( $l ) as $p ) {
		$key = $p['override'] ? "o|{$p['from']}|{$p['to']}" : 'm|' . substr( $p['from'], 0, 7 );
		foreach ( array( 'sun_thu' => array( 0, 1, 2, 3, 4 ), 'fri_sat' => array( 5, 6 ) ) as $grp => $days ) {
			$sid = acs_direct_season( "$key|$grp", sprintf( 'Direct %s %s', $p['label'], 'sun_thu' === $grp ? 'Sun–Thu' : 'Fri–Sat' ), $p['from'], $p['to'], $days );
			if ( $sid ) {
				$rows[] = array( 'season' => $sid, 'price' => array( 'periods' => array( 1 ), 'adults' => $capacity, 'children' => 0,
					'prices' => array( $p[ $grp ] ), 'enable_variations' => false, 'variations' => array() ) );
			}
		}
	}
	$rate = get_posts( array( 'post_type' => 'mphb_rate', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids',
		'meta_query' => array( array( 'key' => 'mphb_room_type_id', 'value' => $tid ) ), 'suppress_filters' => true ) );
	$rid  = $rate ? (int) $rate[0] : wp_insert_post( array( 'post_type' => 'mphb_rate', 'post_status' => 'publish', 'post_title' => $l['name'] ) );
	update_post_meta( $rid, 'mphb_room_type_id', $tid );
	update_post_meta( $rid, 'mphb_season_prices', $rows );
	update_post_meta( $rid, 'mphb_description', '' );
	do_action( 'acs_direct_rates_applied', $slug, $rid );
	return count( $rows );
}

/* ---------------------------------------------------------------------------------------------
 * 25. Referral codes
 * - Coupons from the config become MotoPress coupons (percentage, nightly total only, 2+ nights).
 * - ?ref=CODE on any URL -> 30-day first-party cookie -> prefilled and applied at checkout.
 * - utm_source/medium/campaign are kept (first visit wins) and saved with the booking.
 * - No stacking: one code per booking (MotoPress), and a referral code is refused when the stay
 *   already gets a weekly/monthly price.
 * ------------------------------------------------------------------------------------------- */

function acs_direct_codes() {
	return array_map( function ( $c ) {
		return strtoupper( $c['code'] );
	}, acs_direct_config()['coupons'] );
}

function acs_direct_sync_coupons( $publish ) {
	$cfg = acs_direct_config();
	$out = array();
	foreach ( $cfg['coupons'] as $c ) {
		$code  = strtoupper( $c['code'] );
		$found = get_posts( array( 'post_type' => 'mphb_coupon', 'title' => $code, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true ) );
		$id    = $found ? (int) $found[0] : wp_insert_post( array( 'post_type' => 'mphb_coupon', 'post_title' => $code, 'post_status' => 'draft' ) );
		if ( ! $id || is_wp_error( $id ) ) {
			continue;
		}
		wp_update_post( array( 'ID' => $id, 'post_status' => $publish ? 'publish' : get_post_status( $id ) ) );
		update_post_meta( $id, '_mphb_description', 'Referral code' . ( $c['partner'] ? ' · partner: ' . $c['partner'] : '' ) . ' (managed in acs-site config)' );
		update_post_meta( $id, '_mphb_type', '' ); // percentage
		update_post_meta( $id, '_mphb_amount', round( (float) $c['pct'] * 100, 2 ) );
		update_post_meta( $id, '_mphb_expiration_date', $c['expires'] ? $c['expires'] : '' );
		update_post_meta( $id, '_mphb_min_nights', max( 1, (int) $cfg['coupon_min_nights'] ) );
		update_post_meta( $id, '_mphb_max_nights', 0 );
		update_post_meta( $id, 'acs_partner', $c['partner'] );
		$out[] = $code . ' (' . get_post_status( $id ) . ')';
	}
	return $out;
}

/** True when the stay already gets a 7- or 28-night price (weekly/monthly discount) for that listing. */
function acs_direct_has_stay_discount( $typeId, $nights ) {
	if ( $nights < 7 ) {
		return false;
	}
	$rate = get_posts( array( 'post_type' => 'mphb_rate', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids',
		'meta_query' => array( array( 'key' => 'mphb_room_type_id', 'value' => (int) $typeId ) ), 'suppress_filters' => true ) );
	foreach ( $rate as $rid ) {
		foreach ( (array) get_post_meta( $rid, 'mphb_season_prices', true ) as $row ) {
			$periods = array_map( 'intval', (array) ( $row['price']['periods'] ?? array() ) );
			foreach ( $periods as $p ) {
				if ( $p > 1 && $nights >= $p ) {
					return true;
				}
			}
		}
	}
	return false;
}

function acs_direct_stacking_error( $code, $typeId, $checkIn, $checkOut ) {
	if ( ! in_array( strtoupper( (string) $code ), acs_direct_codes(), true ) ) {
		return '';
	}
	$nights = (int) round( ( strtotime( $checkOut ) - strtotime( $checkIn ) ) / DAY_IN_SECONDS );
	return acs_direct_has_stay_discount( $typeId, $nights )
		? 'This code can’t be combined with the weekly or monthly price this stay already gets.' : '';
}

// AJAX "Apply" on checkout: refuse a referral code on a stay that already has a weekly/monthly price.
foreach ( array( 'wp_ajax_mphb_apply_coupon', 'wp_ajax_nopriv_mphb_apply_coupon' ) as $acs_hook ) {
	add_action( $acs_hook, function () {
		$in   = wp_unslash( $_REQUEST ); // phpcs:ignore WordPress.Security.NonceVerification
		$form = array();
		if ( ! empty( $in['formValues'] ) && is_array( $in['formValues'] ) ) {
			$form = $in['formValues'];
		}
		$code = $in['mphb_coupon_code'] ?? ( $form['mphb_coupon_code'] ?? '' );
		$cin  = $form['mphb_check_in_date'] ?? ( $in['mphb_check_in_date'] ?? '' );
		$cout = $form['mphb_check_out_date'] ?? ( $in['mphb_check_out_date'] ?? '' );
		$tid  = 0;
		foreach ( (array) ( $form['mphb_room_details'] ?? array() ) as $d ) {
			$tid = (int) ( $d['room_type_id'] ?? 0 );
			break;
		}
		if ( $code && $cin && $cout && $tid ) {
			$err = acs_direct_stacking_error( $code, $tid, $cin, $cout );
			if ( $err ) {
				wp_send_json_error( array( 'message' => $err ) ); // MotoPress shows data.message under the coupon field
			}
		}
	}, 1 );
}

// Final checkout submit: same rule (drop the code before MotoPress applies it).
add_action( 'init', function () {
	if ( empty( $_POST['mphb_applied_coupon_code'] ) || empty( $_POST['mphb_check_in_date'] ) || empty( $_POST['mphb_check_out_date'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return;
	}
	$tid = acs_direct_checkout_type_id();
	if ( $tid && acs_direct_stacking_error( wp_unslash( $_POST['mphb_applied_coupon_code'] ), $tid, wp_unslash( $_POST['mphb_check_in_date'] ), wp_unslash( $_POST['mphb_check_out_date'] ) ) ) { // phpcs:ignore
		unset( $_POST['mphb_applied_coupon_code'] );
	}
}, 1 );

// ?ref=CODE and utm_* -> first-party cookies.
add_action( 'template_redirect', function () {
	$days = (int) acs_direct_config()['ref_cookie_days'];
	$opts = array( 'expires' => time() + $days * DAY_IN_SECONDS, 'path' => '/', 'secure' => is_ssl(), 'httponly' => false, 'samesite' => 'Lax' );
	if ( ! empty( $_GET['ref'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		$ref = strtoupper( preg_replace( '/[^A-Za-z0-9_-]/', '', wp_unslash( $_GET['ref'] ) ) ); // phpcs:ignore
		if ( $ref ) {
			setcookie( 'acs_ref', $ref, $opts );
			$_COOKIE['acs_ref'] = $ref;
		}
	}
	if ( ! empty( $_GET['utm_source'] ) && empty( $_COOKIE['acs_utm'] ) ) { // phpcs:ignore
		$utm = array();
		foreach ( array( 'utm_source', 'utm_medium', 'utm_campaign' ) as $k ) {
			$utm[ $k ] = isset( $_GET[ $k ] ) ? substr( sanitize_text_field( wp_unslash( $_GET[ $k ] ) ), 0, 80 ) : ''; // phpcs:ignore
		}
		setcookie( 'acs_utm', wp_json_encode( $utm ), $opts );
	}
} );

// Checkout: prefill the remembered code and press Apply once.
add_action( 'wp_footer', function () {
	if ( ! function_exists( 'mphb_is_checkout_page' ) || ! mphb_is_checkout_page() || empty( $_COOKIE['acs_ref'] ) ) {
		return;
	}
	$ref = strtoupper( preg_replace( '/[^A-Za-z0-9_-]/', '', wp_unslash( $_COOKIE['acs_ref'] ) ) ); // phpcs:ignore
	if ( ! in_array( $ref, acs_direct_codes(), true ) ) {
		return;
	}
	?>
	<script>
	(function () {
		var code = <?php echo wp_json_encode( $ref ); ?>;
		function go() {
			var input = document.querySelector('input[name="mphb_coupon_code"]');
			if (!input || input.value) return;
			input.value = code;
			var btn = input.closest('form') && input.closest('form').querySelector('.mphb-apply-coupon-code-button, button[name="mphb_apply_coupon"], .mphb-coupon-code-wrapper button');
			if (btn) btn.click();
		}
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
	})();
	</script>
	<?php
}, 30 );

// Save code, partner and utm values with the booking.
add_action( 'mphb_create_booking_by_user', function ( $booking ) {
	$id   = $booking->getId();
	$code = method_exists( $booking, 'getCouponCode' ) ? (string) $booking->getCouponCode() : '';
	if ( $code && ! is_numeric( $code ) ) {
		update_post_meta( $id, '_acs_coupon_code', strtoupper( $code ) );
		foreach ( acs_direct_config()['coupons'] as $c ) {
			if ( strtoupper( $c['code'] ) === strtoupper( $code ) ) {
				update_post_meta( $id, '_acs_partner', $c['partner'] );
			}
		}
	}
	if ( ! empty( $_COOKIE['acs_ref'] ) ) {
		update_post_meta( $id, '_acs_ref', sanitize_text_field( wp_unslash( $_COOKIE['acs_ref'] ) ) );
	}
	if ( ! empty( $_COOKIE['acs_utm'] ) ) {
		$utm = json_decode( wp_unslash( $_COOKIE['acs_utm'] ), true ); // phpcs:ignore
		foreach ( (array) $utm as $k => $v ) {
			if ( in_array( $k, array( 'utm_source', 'utm_medium', 'utm_campaign' ), true ) ) {
				update_post_meta( $id, '_acs_' . $k, sanitize_text_field( $v ) );
			}
		}
	}
	update_post_meta( $id, '_acs_nightly_total', acs_direct_nightly_total( $booking ) );
}, 20 );

/** Accommodation total before the coupon (nights only, no cleaning fee). */
function acs_direct_nightly_total( $booking ) {
	try {
		$b = $booking->getPriceBreakdown();
		$sum = 0.0;
		foreach ( (array) ( $b['rooms'] ?? array() ) as $r ) {
			$sum += (float) ( $r['room']['total'] ?? 0 );
		}
		return round( $sum, 2 );
	} catch ( \Throwable $e ) {
		return 0;
	}
}

// Admin booking screen: a small "Referral" box and a list column.
add_action( 'add_meta_boxes', function () {
	add_meta_box( 'acs_referral', 'Referral / source', function ( $post ) {
		$rows = array(
			'Code used' => get_post_meta( $post->ID, '_acs_coupon_code', true ),
			'Partner'   => get_post_meta( $post->ID, '_acs_partner', true ),
			'?ref link' => get_post_meta( $post->ID, '_acs_ref', true ),
			'utm_source' => get_post_meta( $post->ID, '_acs_utm_source', true ),
			'utm_medium' => get_post_meta( $post->ID, '_acs_utm_medium', true ),
			'utm_campaign' => get_post_meta( $post->ID, '_acs_utm_campaign', true ),
		);
		echo '<table class="widefat striped"><tbody>';
		foreach ( $rows as $k => $v ) {
			echo '<tr><th>' . esc_html( $k ) . '</th><td>' . esc_html( $v ? $v : '—' ) . '</td></tr>';
		}
		echo '</tbody></table>';
	}, 'mphb_booking', 'side' );
} );
add_filter( 'manage_mphb_booking_posts_columns', function ( $cols ) {
	$cols['acs_code'] = 'Code';
	return $cols;
} );
add_action( 'manage_mphb_booking_posts_custom_column', function ( $col, $id ) {
	if ( 'acs_code' === $col ) {
		echo esc_html( get_post_meta( $id, '_acs_coupon_code', true ) );
	}
}, 10, 2 );

/* ---------------------------------------------------------------------------------------------
 * 26. "Book direct and save" badge: [acs_direct_badge] (uses the page's listing, or slug="...")
 * ------------------------------------------------------------------------------------------- */

add_shortcode( 'acs_direct_badge', function ( $atts ) {
	$pct = (int) round( acs_direct_config()['DIRECT_DISCOUNT'] * 100 );
	return '<div class="acs-direct-badge" role="note"><span class="acs-direct-badge__pill">Book direct and save</span>'
		. '<span class="acs-direct-badge__line">Lower than Airbnb: no platform service fee and ' . esc_html( $pct ) . '% off nightly rates.</span></div>';
} );

add_action( 'wp_head', function () {
	?>
	<style id="acs-direct">
	.acs-direct-badge{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:12px 0;padding:10px 14px;border-radius:10px;background:#e8f5e9;color:#1b5e20;font-size:15px;line-height:1.4}
	.acs-direct-badge__pill{font-weight:700;background:#1b5e20;color:#fff;border-radius:999px;padding:4px 12px;font-size:13px;letter-spacing:.02em;white-space:nowrap}
	.mphb-price-breakdown .acs-cleaning-fee th{font-weight:400}
	</style>
	<?php
} );

/* ---------------------------------------------------------------------------------------------
 * 27. Admin: Tools → Direct Pricing (rate table, Apply rates, Sync coupons, referral CSV)
 * ------------------------------------------------------------------------------------------- */

add_action( 'admin_menu', function () {
	add_management_page( 'Direct Pricing', 'Direct Pricing', 'manage_options', 'acs-direct-pricing', 'acs_direct_admin_page' );
} );

/**
 * Extend a hand-priced listing (Bear Den) past the end of its seasons without touching the seasons other
 * listings share: for every season row in its rate that ends before $to, add a copy of that row on a new
 * listing-only season (same weekdays, same prices) running from the day after it ends to $to. Re-running is safe.
 */
function acs_direct_extend_manual_rate( $slug, $to ) {
	$tid = acs_direct_type_id( $slug );
	if ( ! $tid ) {
		return 'not found';
	}
	$parse = function ( $d ) {
		foreach ( array( 'Y-m-d', 'm/d/Y', 'd/m/Y' ) as $f ) {
			$o = DateTime::createFromFormat( '!' . $f, (string) $d );
			if ( $o ) {
				return $o;
			}
		}
		return null;
	};
	$rates = get_posts( array( 'post_type' => 'mphb_rate', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids',
		'meta_query' => array( array( 'key' => 'mphb_room_type_id', 'value' => (int) $tid ) ), 'suppress_filters' => true ) );
	$added = 0;
	foreach ( $rates as $rid ) {
		$rows = (array) get_post_meta( $rid, 'mphb_season_prices', true );
		$have = array_map( function ( $r ) {
			return (int) ( $r['season'] ?? 0 );
		}, $rows );
		$new = array();
		foreach ( $rows as $row ) {
			$sid = (int) ( $row['season'] ?? 0 );
			if ( ! $sid || 0 === strpos( (string) get_post_meta( $sid, 'acs_direct_season', true ), 'ext-' ) ) {
				continue;
			}
			$end = $parse( get_post_meta( $sid, 'mphb_end_date', true ) );
			if ( ! $end || $end->format( 'Y-m-d' ) >= $to ) {
				continue;
			}
			$from   = ( clone $end )->modify( '+1 day' )->format( 'Y-m-d' );
			$title  = get_the_title( $tid ) . ': ' . get_the_title( $sid ) . ' (' . $from . ' to ' . $to . ')';
			$days   = (array) get_post_meta( $sid, 'mphb_days', true );
			$newSid = acs_direct_season( "ext-$rid-$sid-$to", $title, $from, $to, $days ? $days : array( '0', '1', '2', '3', '4', '5', '6' ) );
			if ( $newSid && ! in_array( $newSid, $have, true ) ) {
				$row['season'] = $newSid;
				$new[]         = $row;
			}
		}
		if ( $new ) {
			update_post_meta( $rid, 'mphb_season_prices', array_merge( $rows, $new ) ); // same order: weekend rows stay above all-week rows
			$added += count( $new );
		}
	}
	return get_the_title( $tid ) . ": $added season price rows added through $to";
}

add_action( 'admin_post_acs_direct_apply', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acs_direct' ) ) {
		wp_die( 'Not allowed' );
	}
	$msg = array();
	$what = sanitize_key( $_POST['what'] ?? '' );
	if ( 'rates' === $what ) {
		foreach ( acs_direct_config()['listings'] as $slug => $l ) {
			if ( ! empty( $l['manual_rates'] ) ) {
				continue;
			}
			$r     = acs_direct_apply_rates( $slug );
			$msg[] = is_wp_error( $r ) ? $r->get_error_message() : "{$l['name']}: $r season prices written";
		}
	} elseif ( 'coupons' === $what || 'coupons_publish' === $what ) {
		$msg = acs_direct_sync_coupons( 'coupons_publish' === $what );
	} elseif ( 'extend_manual' === $what ) {
		foreach ( acs_direct_config()['listings'] as $slug => $l ) {
			if ( ! empty( $l['manual_rates'] ) ) {
				$msg[] = acs_direct_extend_manual_rate( $slug, '2028-04-30' );
			}
		}
	}
	unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
	wp_safe_redirect( add_query_arg( array( 'page' => 'acs-direct-pricing', 'acs_msg' => rawurlencode( implode( ' · ', $msg ) ) ), admin_url( 'tools.php' ) ) );
	exit;
} );

add_action( 'admin_post_acs_direct_csv', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acs_direct' ) ) {
		wp_die( 'Not allowed' );
	}
	$month = preg_match( '/^\d{4}-\d{2}$/', $_POST['month'] ?? '' ) ? $_POST['month'] : current_time( 'Y-m' ); // phpcs:ignore
	$ids   = get_posts( array( 'post_type' => 'mphb_booking', 'post_status' => array( 'confirmed', 'pending', 'pending-user', 'pending-payment' ), 'numberposts' => -1, 'fields' => 'ids',
		'meta_query' => array( array( 'key' => '_acs_coupon_code', 'compare' => 'EXISTS' ) ),
		'date_query' => array( array( 'after' => "$month-01 00:00:00", 'before' => date( 'Y-m-t 23:59:59', strtotime( "$month-01" ) ), 'inclusive' => true ) ), 'suppress_filters' => true ) );
	$pct = (float) acs_direct_config()['commission_pct'];
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="referral-payouts-' . $month . '.csv"' );
	$f = fopen( 'php://output', 'w' );
	fputcsv( $f, array( 'Booking', 'Status', 'Date booked', 'Check-in', 'Check-out', 'Listing', 'Code', 'Partner', 'Nightly total', 'Commission ' . ( $pct * 100 ) . '%', 'utm_source', 'utm_medium', 'utm_campaign' ) );
	foreach ( $ids as $id ) {
		$booking = MPHB()->getBookingRepository()->findById( $id );
		$tid     = $booking ? acs_direct_booking_type_id( $booking ) : 0;
		$nightly = (float) get_post_meta( $id, '_acs_nightly_total', true );
		fputcsv( $f, array( $id, get_post_status( $id ), get_the_date( 'Y-m-d', $id ), get_post_meta( $id, 'mphb_check_in_date', true ), get_post_meta( $id, 'mphb_check_out_date', true ),
			$tid ? get_the_title( $tid ) : '', get_post_meta( $id, '_acs_coupon_code', true ), get_post_meta( $id, '_acs_partner', true ), number_format( $nightly, 2, '.', '' ),
			number_format( $nightly * $pct, 2, '.', '' ), get_post_meta( $id, '_acs_utm_source', true ), get_post_meta( $id, '_acs_utm_medium', true ), get_post_meta( $id, '_acs_utm_campaign', true ) ) );
	}
	fclose( $f );
	exit;
} );

function acs_direct_admin_page() {
	$cfg = acs_direct_config();
	echo '<div class="wrap"><h1>Direct Pricing</h1>';
	if ( ! empty( $_GET['acs_msg'] ) ) { // phpcs:ignore
		echo '<div class="notice notice-success"><p>' . esc_html( rawurldecode( wp_unslash( $_GET['acs_msg'] ) ) ) . '</p></div>'; // phpcs:ignore
	}
	// Read-only check of the whole-house <-> suite blocking: what each listing has booked and what it blocks.
	echo '<h2>Rosella blocking check</h2><table class="widefat striped" style="max-width:900px"><thead><tr><th>Listing</th><th>Rooms</th><th>Bookings found (from today)</th></tr></thead><tbody>';
	foreach ( $cfg['families'] as $wholeSlug => $suiteSlugs ) {
		foreach ( array_merge( array( $wholeSlug ), $suiteSlugs ) as $slug ) {
			$tid   = acs_direct_type_id( $slug );
			$rooms = $tid ? acs_direct_room_ids( $tid ) : array();
			$rows  = array();
			if ( $rooms && function_exists( 'MPHB' ) ) {
				foreach ( array( array( 'room_locked' => true ), array( 'post_status' => array( 'imported' ) ) ) as $x ) {
					try {
						foreach ( (array) MPHB()->getBookingRepository()->findAll( array( 'rooms' => $rooms, 'date_from' => current_time( 'Y-m-d' ), 'date_to' => gmdate( 'Y-m-d', strtotime( '+3 years' ) ) ) + $x ) as $b ) {
							$rows[ $b->getId() ] = sprintf( '#%d %s→%s %s [%s, %s] %s', $b->getId(), $b->getCheckInDate()->format( 'm/d' ), $b->getCheckOutDate()->format( 'm/d' ),
								get_post_status( $b->getId() ), $b->isImported() ? 'imported' : 'website', $b->isImported() ? $b->getICalSummary() : '', acs_direct_is_real_stay( $b ) ? 'BLOCKS RELATIVES' : 'placeholder' );
						}
					} catch ( \Throwable $e ) {
						$rows[] = 'error: ' . $e->getMessage();
					}
				}
			}
			echo '<tr><td>' . esc_html( $slug . ' (type #' . (int) $tid . ', ' . get_post_status( $tid ) . ')' ) . '</td><td>' . esc_html( implode( ',', $rooms ) ) . '</td><td>' . esc_html( implode( ' | ', $rows ) ?: '—' ) . '</td></tr>';
		}
	}
	$rules = acs_direct_family_rules();
	echo '</tbody></table><p><strong>Blocks in effect:</strong> ' . esc_html( $rules ? implode( ' | ', array_map( function ( $r ) {
		return 'type #' . $r['room_type_id'] . ' ' . $r['date_from'] . '→' . $r['date_to'] . ' (' . $r['comment'] . ')';
	}, $rules ) ) : 'none' ) . '</p>';
	echo '<p>Direct nightly = Airbnb nightly × (1 − ' . esc_html( $cfg['DIRECT_DISCOUNT'] ) . '), rounded. Edit <code>acs_direct_config()</code> in <code>acs-site/includes/direct-booking.php</code>, then press Apply rates.</p>';
	foreach ( $cfg['listings'] as $slug => $l ) {
		$tid = acs_direct_type_id( $slug );
		echo '<h2>' . esc_html( $l['name'] ) . ' <small>(' . esc_html( $slug ) . ', ' . ( $tid ? 'type #' . (int) $tid . ', ' . esc_html( get_post_status( $tid ) ) : 'not created yet' ) . ')</small></h2>';
		if ( ! empty( $l['manual_rates'] ) ) {
			echo '<p>Rates are managed in MotoPress → Rates (already the direct price).</p>';
			continue;
		}
		echo '<table class="widefat striped" style="max-width:720px"><thead><tr><th>Period</th><th>Airbnb Sun–Thu</th><th>Direct Sun–Thu</th><th>Airbnb Fri–Sat</th><th>Direct Fri–Sat</th></tr></thead><tbody>';
		foreach ( acs_direct_price_plan( $l ) as $p ) {
			$a = $p['airbnb'] ?? array( '', '' );
			echo '<tr><td>' . esc_html( $p['label'] . ( $p['override'] ? " ({$p['from']} – {$p['to']})" : '' ) ) . '</td><td>' . esc_html( $a[0] ) . '</td><td><b>$' . esc_html( $p['sun_thu'] ) . '</b></td><td>' . esc_html( $a[1] ) . '</td><td><b>$' . esc_html( $p['fri_sat'] ) . '</b></td></tr>';
		}
		echo '</tbody></table><p>Cleaning fee: $' . esc_html( $l['cleaning_fee'] ?? 0 ) . ' · Pet fee: $' . esc_html( $l['pet_fee_per_stay'] ?? 0 ) . ' per pet per stay</p>';
	}
	$form = function ( $action, $what, $label, $extra = '' ) {
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="display:inline-block;margin:0 8px 8px 0">';
		wp_nonce_field( 'acs_direct' );
		echo '<input type="hidden" name="action" value="' . esc_attr( $action ) . '"><input type="hidden" name="what" value="' . esc_attr( $what ) . '">' . $extra; // phpcs:ignore
		submit_button( $label, 'secondary', 'submit', false );
		echo '</form>';
	};
	echo '<h2>Actions</h2>';
	$form( 'acs_direct_setup', 'setup', 'Create Rosella drafts' );
	$form( 'acs_direct_apply', 'rates', 'Apply rates to MotoPress' );
	$form( 'acs_direct_apply', 'coupons', 'Sync referral codes (keep status)' );
	$form( 'acs_direct_apply', 'coupons_publish', 'Sync + turn referral codes ON' );
	$form( 'acs_direct_apply', 'extend_manual', 'Extend Bear Den prices to Apr 30, 2028' );
	echo '<h2>Referral codes</h2><p>' . esc_html( implode( ', ', acs_direct_codes() ) ) . ' — ' . esc_html( $cfg['coupons'][0]['pct'] * 100 ) . '% off the nightly total, ' . (int) $cfg['coupon_min_nights'] . '+ nights, one code per booking, not with weekly/monthly prices. Share links like <code>' . esc_html( home_url( '/?ref=AURORA10' ) ) . '</code>.</p>';
	$form( 'acs_direct_csv', 'csv', 'Download payouts CSV', '<input type="month" name="month" value="' . esc_attr( current_time( 'Y-m' ) ) . '"> ' );
	echo '<h2>Whole-house blocking</h2><p>Live blocks added from bookings right now: ' . count( acs_direct_family_rules() ) . '.</p></div>';
}

/* ---------------------------------------------------------------------------------------------
 * 28. Rosella listing pages: no-cache like the other listing pages + VacationRental schema
 * Page slugs match their Accommodation Type slugs (same URL pattern as every listing: /<slug>/).
 * ------------------------------------------------------------------------------------------- */

function acs_direct_page_id( $slug ) {
	static $cache = array();
	if ( ! isset( $cache[ $slug ] ) ) {
		$p               = get_page_by_path( $slug, OBJECT, 'page' );
		$cache[ $slug ] = $p ? (int) $p->ID : 0;
	}
	return $cache[ $slug ];
}

add_filter( 'acs_config', function ( $c ) {
	foreach ( array( 'moose-lodge', 'moose-and-bear-lodge' ) as $slug ) {
		$id = acs_direct_page_id( $slug );
		if ( $id && ! in_array( $id, $c['listing_page_ids'], true ) ) {
			$c['listing_page_ids'][] = $id;
		}
	}
	return $c;
} );

add_filter( 'acs_listing_schema', function ( $s ) {
	$addr  = array( 'streetAddress' => '10 Rosella Ave', 'addressLocality' => 'Fairbanks', 'addressRegion' => 'AK', 'postalCode' => '99701', 'addressCountry' => 'US' );
	$facts = array(
		'rental-unit-in-fairbanks' => array( 'name' => 'Bear Den (upstairs suite) · 10½ Rosella', 'bedrooms' => 1, 'bathrooms' => 1, 'occupancy' => 4 ),
		'moose-lodge'              => array( 'name' => 'Moose Lodge (main-level suite) · 10 Rosella', 'bedrooms' => 2, 'bathrooms' => 1, 'occupancy' => 6 ),
		'moose-and-bear-lodge'     => array( 'name' => 'Moose & Bear Lodge (whole house) · 10 Rosella', 'bedrooms' => 3, 'bathrooms' => 2, 'occupancy' => 10 ),
	);
	foreach ( $facts as $slug => $f ) {
		$id = acs_direct_page_id( $slug );
		if ( $id ) {
			$s[ $id ] = $f + array( 'address' => $addr, 'amenities' => array( 'Pets allowed', 'Self check-in', 'Full kitchen', 'Free parking', 'Washer', 'Dryer', 'Wi-Fi' ) );
		}
	}
	return $s;
} );

/* ---------------------------------------------------------------------------------------------
 * 29. One-time setup: "Create Rosella drafts" (Tools → Direct Pricing)
 * Creates the Moose Lodge and Moose & Bear Lodge Accommodation Types (DRAFT), one Accommodation
 * each, and DRAFT copies of the Bear Den Elementor page (same template, same widgets) with the
 * booking widget pointed at the new type. Safe to press again: existing items are left alone.
 * ------------------------------------------------------------------------------------------- */

function acs_direct_setup_rosella() {
	$src_type = acs_direct_type_id( 'rental-unit-in-fairbanks' );
	$src_page = acs_direct_page_id( 'rental-unit-in-fairbanks' );
	$out      = array();
	$defs     = array(
		'moose-lodge'          => array( 'title' => 'Moose Lodge', 'adults' => 6, 'page_title' => 'Moose Lodge',
			'excerpt' => 'Main-level 2BR/1BA suite at 10 Rosella Ave, across from Creamer’s Field: queen bedroom with the moose accent wall, full bedroom, living room with fireplace, full kitchen.' ),
		'moose-and-bear-lodge' => array( 'title' => 'Moose & Bear Lodge', 'adults' => 10, 'page_title' => 'Moose & Bear Lodge',
			'excerpt' => 'The whole house at 10 Rosella Ave, across from Creamer’s Field: both suites in one booking. 3BR/2BA, 2 kitchens, 2 living rooms, sleeps up to 10.' ),
	);
	foreach ( $defs as $slug => $d ) {
		// Accommodation Type
		$tid = acs_direct_type_id( $slug );
		if ( ! $tid ) {
			$tid = wp_insert_post( array( 'post_type' => 'mphb_room_type', 'post_status' => 'draft', 'post_title' => $d['title'], 'post_name' => $slug,
				'post_excerpt' => $d['excerpt'], 'post_content' => $d['excerpt'] ) );
			if ( ! $tid || is_wp_error( $tid ) ) {
				$out[] = "$slug: could not create the accommodation type";
				continue;
			}
			update_post_meta( $tid, 'mphb_adults_capacity', $d['adults'] );
			update_post_meta( $tid, 'mphb_children_capacity', 0 );
			update_post_meta( $tid, 'mphb_pets_allowed', 1 );
			if ( $src_type ) {
				foreach ( array( 'mphb_room_type_facility', 'mphb_city' ) as $tax ) {
					wp_set_object_terms( $tid, wp_get_object_terms( $src_type, $tax, array( 'fields' => 'ids' ) ), $tax );
				}
			}
			$out[] = "$slug: accommodation type #$tid (draft)";
		}
		// One Accommodation (the bookable unit)
		if ( ! acs_direct_room_ids( $tid ) ) {
			$rid = wp_insert_post( array( 'post_type' => 'mphb_room', 'post_status' => 'publish', 'post_title' => $d['title'] . ' 1' ) );
			update_post_meta( $rid, 'mphb_room_type_id', $tid );
			$out[] = "$slug: accommodation #$rid";
		}
		// Elementor page copy
		if ( ! acs_direct_page_id( $slug ) && $src_page ) {
			$src = get_post( $src_page );
			$pid = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'draft', 'post_title' => $d['page_title'], 'post_name' => $slug,
				'post_content' => $src->post_content, 'post_excerpt' => $src->post_excerpt, 'post_parent' => $src->post_parent, 'menu_order' => $src->menu_order ) );
			foreach ( get_post_meta( $src_page ) as $key => $values ) {
				if ( in_array( $key, array( '_edit_lock', '_edit_last', '_elementor_css', '_wp_old_slug' ), true ) || 0 === strpos( $key, '_oembed' ) ) {
					continue;
				}
				foreach ( $values as $v ) {
					$v = maybe_unserialize( $v );
					if ( '_elementor_data' === $key ) {
						$v = acs_direct_retarget_elementor( $v, (int) $src_type, (int) $tid );
					}
					add_post_meta( $pid, $key, is_string( $v ) ? wp_slash( $v ) : $v );
				}
			}
			$out[] = "$slug: page #$pid (draft, copy of #$src_page)";
		}
	}
	unset( $GLOBALS['acs_family_rules_cache'] ); delete_transient( 'acs_family_rules' );
	return $out;
}

/** Point MotoPress/Elementor booking widgets in a copied page at another Accommodation Type. */
function acs_direct_retarget_elementor( $json, $from, $to ) {
	$data = is_string( $json ) ? json_decode( $json, true ) : $json;
	if ( ! is_array( $data ) || ! $from || ! $to ) {
		return $json;
	}
	$walk = function ( &$els ) use ( &$walk, $from, $to ) {
		foreach ( $els as &$el ) {
			if ( isset( $el['widgetType'] ) && 0 === strpos( $el['widgetType'], 'mphb' ) && ! empty( $el['settings'] ) ) {
				foreach ( $el['settings'] as $k => $v ) {
					if ( (string) $v === (string) $from ) {
						$el['settings'][ $k ] = (string) $to;
					}
				}
			}
			if ( ! empty( $el['elements'] ) ) {
				$walk( $el['elements'] );
			}
		}
	};
	$walk( $data );
	return wp_json_encode( $data );
}

add_action( 'admin_post_acs_direct_setup', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acs_direct' ) ) {
		wp_die( 'Not allowed' );
	}
	$msg = acs_direct_setup_rosella();
	wp_safe_redirect( add_query_arg( array( 'page' => 'acs-direct-pricing', 'acs_msg' => rawurlencode( implode( ' · ', $msg ? $msg : array( 'Everything already exists' ) ) ) ), admin_url( 'tools.php' ) ) );
	exit;
} );
