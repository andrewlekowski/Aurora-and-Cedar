<?php
/**
 * Plugin Name: ACS Review Count
 * Description: [acs_review_count] prints the Airbnb review count stored in the acs_review_count option.
 *              Update it with: wp option update acs_review_count 780
 *              or from wp-admin/options.php (option name: acs_review_count).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_shortcode( 'acs_review_count', function () {
	$count = get_option( 'acs_review_count', '765' );
	return esc_html( number_format_i18n( absint( $count ) ) );
} );
