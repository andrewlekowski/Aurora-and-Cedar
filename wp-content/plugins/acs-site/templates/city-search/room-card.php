<?php
/**
 * Accommodation card for the search results loop.
 *
 * Replaces templates/shortcodes/search-results/room-content.php via the
 * 'mphb_get_template_part' filter. Receives the same variables:
 * $checkInDate, $checkOutDate (DateTime|null), $adults, $children, $isShow* flags.
 *
 * With dates: "Book Now" posts straight to MotoPress checkout (same fields as the listing's
 * own direct-booking form) and "View details" opens the listing with the dates prefilled.
 * Without dates: "Book Now" opens the listing page, as before.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$module   = ACS_City_Search::instance();
$roomType = MPHB()->getCurrentRoomType();

if ( ! $roomType ) {
	return;
}

$postId  = $roomType->getOriginalId();
$title   = $roomType->getTitle();
$address = $module->fullAddress( $postId );

$hasDates   = isset( $checkInDate, $checkOutDate ) && $checkInDate instanceof \DateTime && $checkOutDate instanceof \DateTime;
$listingUrl = acs_listing_url( $roomType );
$detailsUrl = $hasDates ? acs_listing_url_with_dates( $roomType, $checkInDate, $checkOutDate, $adults, $children ) : $listingUrl;

// Short description: prefer the excerpt, fall back to the trimmed description.
$excerpt = trim( (string) $roomType->getExcerpt() );
if ( $excerpt === '' ) {
	$excerpt = trim( wp_strip_all_tags( (string) $roomType->getDescription() ) );
}
if ( $excerpt !== '' ) {
	$excerpt = wp_trim_words( $excerpt, 30, '&hellip;' );
}

// Price for the searched dates, plus the undiscounted total for 7+ night stays.
$priceHtml = '';
$discount  = null;
if ( ! empty( $isShowPrice ) && $hasDates ) {
	$periodPrice = mphb_get_room_type_period_price( $checkInDate, $checkOutDate, $roomType );
	$priceHtml   = mphb_format_price( $periodPrice );
	$discount    = acs_room_type_stay_discount( $roomType, $checkInDate, $checkOutDate, $adults, $children, $periodPrice );
}

// A few amenities to show as chips.
$facilities = $roomType->getFacilities();
$chips      = is_array( $facilities ) ? array_slice( array_values( $facilities ), 0, 4 ) : array();

$capacity = $roomType->getTotalCapacity();
$imageId  = $roomType->getFeaturedImageId();
if ( ! $imageId ) {
	$imageId = get_post_thumbnail_id( get_the_ID() );
}

do_action( 'mphb_sc_search_results_before_room' );
?>
<article class="mphb-air-card" data-room-id="<?php echo esc_attr( $postId ); ?>">

	<a class="mphb-air-card-media" href="<?php echo esc_url( $detailsUrl ); ?>">
		<?php
		if ( $imageId ) {
			echo wp_get_attachment_image(
				$imageId,
				'large',
				false,
				array(
					'class'   => 'mphb-air-card-img',
					'loading' => 'lazy',
					'alt'     => esc_attr( $title ),
				)
			);
		} else {
			echo '<span class="mphb-air-card-noimg"></span>';
		}
		?>
	</a>

	<div class="mphb-air-card-body">
		<div class="mphb-air-card-top">
			<h3 class="mphb-air-card-title">
				<a href="<?php echo esc_url( $detailsUrl ); ?>"><?php echo esc_html( $title ); ?></a>
			</h3>

			<?php if ( $address ) : ?>
				<p class="mphb-air-card-address"><?php echo esc_html( $address ); ?></p>
			<?php endif; ?>

			<?php if ( $excerpt ) : ?>
				<p class="mphb-air-card-excerpt"><?php echo esc_html( $excerpt ); ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $chips ) ) : ?>
				<ul class="mphb-air-card-chips">
					<?php foreach ( $chips as $chip ) : ?>
						<li><?php echo esc_html( is_object( $chip ) ? $chip->name : $chip ); ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>

		<div class="mphb-air-card-footer">
			<div class="mphb-air-card-meta">
				<?php if ( $priceHtml ) : ?>
					<span class="mphb-air-card-price">
						<?php if ( $discount ) : ?>
							<s class="acs-card-was" aria-hidden="true"><?php echo esc_html( acs_money_text( $discount['base_total'] ) ); ?></s>
							<span class="screen-reader-text"><?php echo esc_html( sprintf( 'was %s, now', acs_money_text( $discount['base_total'] ) ) ); ?></span>
						<?php endif; ?>
						<?php
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						echo $priceHtml;
						?>
						<span class="mphb-air-card-price-note"><?php esc_html_e( 'total', 'acs-site' ); ?></span>
					</span>
					<?php if ( $discount ) : ?>
						<span class="acs-card-discount"><?php echo esc_html( sprintf( '%s discount applied: %d%% off every night', $discount['label'], $discount['pct'] ) ); ?></span>
					<?php endif; ?>
				<?php endif; ?>
				<?php
				$nights = $hasDates ? \MPHB\Utils\DateUtils::calcNights( $checkInDate, $checkOutDate ) : 0;
				if ( $nights && acs_config()['long_stay_notice'] && $nights >= acs_config()['long_stay_nights'] ) :
					?>
					<span class="acs-card-longstay"><?php esc_html_e( 'Long stay: screening applies; we reply within 24 hours.', 'acs-site' ); ?>
						<a href="<?php echo esc_attr( acs_long_stay_mailto( $title, $checkInDate, $checkOutDate, $nights ) ); ?>"><?php esc_html_e( 'Message us', 'acs-site' ); ?></a>
					</span>
				<?php endif; ?>
				<?php if ( $capacity ) : ?>
					<span class="mphb-air-card-capacity">
						<?php echo esc_html( sprintf( _n( 'Up to %d guest', 'Up to %d guests', $capacity, 'acs-site' ), $capacity ) ); ?>
					</span>
				<?php endif; ?>
			</div>

			<?php if ( $hasDates ) : ?>
				<div class="acs-card-actions">
					<?php acs_render_book_now_form( $roomType, $checkInDate, $checkOutDate, $adults, $children ); ?>
					<a class="acs-viewdetails" href="<?php echo esc_url( $detailsUrl ); ?>"><?php esc_html_e( 'View details', 'acs-site' ); ?></a>
				</div>
			<?php else : ?>
				<a class="mphb-air-booknow" href="<?php echo esc_url( $listingUrl ); ?>">
					<?php esc_html_e( 'Book Now', 'acs-site' ); ?>
				</a>
			<?php endif; ?>
		</div>
	</div>
</article>
<?php
do_action( 'mphb_sc_search_results_after_room' );
