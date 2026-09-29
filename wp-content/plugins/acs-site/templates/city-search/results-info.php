<?php
/**
 * Results header (replaces shortcodes/search-results/results-info).
 *
 * Variables: $roomTypesCount, $adults, $children, $checkInDate, $checkOutDate
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$adults   = isset( $adults ) ? (int) $adults : 0;
$children = isset( $children ) ? (int) $children : 0;
$guests   = max( 1, $adults + $children );

$meta = array();
if ( ! empty( $checkInDate ) && ! empty( $checkOutDate ) ) {
	$meta[] = $checkInDate . ' &ndash; ' . $checkOutDate;
}
$meta[] = sprintf( _n( '%d guest', '%d guests', $guests, 'acs-site' ), $guests );
?>
<header class="mphb-air-results-head">
	<?php if ( $roomTypesCount > 0 ) : ?>
		<h2 class="mphb-air-results-title">
			<?php echo esc_html( sprintf( _n( '%s stay available', '%s stays available', $roomTypesCount, 'acs-site' ), number_format_i18n( $roomTypesCount ) ) ); ?>
		</h2>
	<?php else : ?>
		<h2 class="mphb-air-results-title"><?php esc_html_e( 'No stays available for these dates', 'acs-site' ); ?></h2>
		<p class="mphb-air-results-empty"><?php esc_html_e( 'Try changing your dates, city, or filters.', 'acs-site' ); ?></p>
	<?php endif; ?>

	<?php if ( ! empty( $meta ) ) : ?>
		<p class="mphb-air-results-sub">
			<?php echo wp_kses_post( implode( ' <span class="mphb-air-dot-sep">&middot;</span> ', $meta ) ); ?>
		</p>
	<?php endif; ?>
</header>
