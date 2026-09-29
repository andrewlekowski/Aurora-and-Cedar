<?php
/**
 * City search form ([mphb_airbnb_search]).
 *
 * Moved out of the MotoPress plugin folder (it was a hand edit there) into the site plugin,
 * unchanged apart from the text domain.
 *
 * Variables: $action, $uniqid, $checkInDisplay, $checkOutDisplay,
 * $checkInTransfer, $checkOutTransfer, $adults, $children, $selCity, $selPets,
 * $selAmen, $cities, $amenities, $childrenAllowed, $childrenAgeText,
 * $minAdults, $maxAdults, $maxChildren
 *
 * The form keeps MotoPress's own class (mphb_sc_search-form) so the plugin's
 * datepicker/calendar initialises on the date fields automatically.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Build a human-readable guests summary, e.g. "2 guests" or "2 adults, 1 child".
if ( $childrenAllowed ) {
	$guestsSummary = sprintf( _n( '%d adult', '%d adults', $adults, 'acs-site' ), $adults );
	if ( $children > 0 ) {
		$guestsSummary .= ', ' . sprintf( _n( '%d child', '%d children', $children, 'acs-site' ), $children );
	}
} else {
	$guestsSummary = sprintf( _n( '%d guest', '%d guests', $adults, 'acs-site' ), $adults );
}
?>
<form method="GET" class="mphb_sc_search-form mphb-air-search" action="<?php echo esc_attr( $action ); ?>">

	<div class="mphb-air-search-bar">

		<div class="mphb-air-field mphb-air-field-where">
			<label for="mphb_city-<?php echo esc_attr( $uniqid ); ?>"><?php esc_html_e( 'Where', 'acs-site' ); ?></label>
			<select id="mphb_city-<?php echo esc_attr( $uniqid ); ?>" name="mphb_city">
				<option value=""><?php esc_html_e( 'All cities', 'acs-site' ); ?></option>
				<?php foreach ( $cities as $city ) : ?>
					<option value="<?php echo esc_attr( $city->term_id ); ?>" <?php selected( $selCity, $city->term_id ); ?>>
						<?php echo esc_html( $city->name ); ?>
					</option>
				<?php endforeach; ?>
			</select>
		</div>

		<div class="mphb-air-field mphb-air-field-date">
			<label for="mphb_check_in_date-<?php echo esc_attr( $uniqid ); ?>"><?php esc_html_e( 'Check in', 'acs-site' ); ?></label>
			<input
				type="text"
				id="mphb_check_in_date-<?php echo esc_attr( $uniqid ); ?>"
				name="mphb_check_in_date"
				value="<?php echo esc_attr( $checkInDisplay ); ?>"
				class="mphb-datepick"
				data-datepick-group="<?php echo esc_attr( $uniqid ); ?>"
				placeholder="<?php esc_attr_e( 'Add dates', 'acs-site' ); ?>"
				inputmode="none"
				autocomplete="off"
				required
			/>
			<input type="hidden" id="mphb_check_in_date-<?php echo esc_attr( $uniqid ); ?>-hidden" name="mphb_check_in_date" value="<?php echo esc_attr( $checkInTransfer ); ?>" />
		</div>

		<div class="mphb-air-field mphb-air-field-date">
			<label for="mphb_check_out_date-<?php echo esc_attr( $uniqid ); ?>"><?php esc_html_e( 'Check out', 'acs-site' ); ?></label>
			<input
				type="text"
				id="mphb_check_out_date-<?php echo esc_attr( $uniqid ); ?>"
				name="mphb_check_out_date"
				value="<?php echo esc_attr( $checkOutDisplay ); ?>"
				class="mphb-datepick"
				data-datepick-group="<?php echo esc_attr( $uniqid ); ?>"
				placeholder="<?php esc_attr_e( 'Add dates', 'acs-site' ); ?>"
				inputmode="none"
				autocomplete="off"
				required
			/>
			<input type="hidden" id="mphb_check_out_date-<?php echo esc_attr( $uniqid ); ?>-hidden" name="mphb_check_out_date" value="<?php echo esc_attr( $checkOutTransfer ); ?>" />
		</div>

		<div class="mphb-air-field mphb-air-field-guests mphb-air-guests"
			data-min-adults="<?php echo esc_attr( $minAdults ); ?>"
			data-max-adults="<?php echo esc_attr( $maxAdults ); ?>"
			data-max-children="<?php echo esc_attr( $maxChildren ); ?>"
			data-children-allowed="<?php echo $childrenAllowed ? '1' : '0'; ?>">
			<label><?php esc_html_e( 'Guests', 'acs-site' ); ?></label>
			<button type="button" class="mphb-air-guests-toggle" aria-haspopup="true" aria-expanded="false">
				<span class="mphb-air-guests-summary"><?php echo esc_html( $guestsSummary ); ?></span>
			</button>

			<input type="hidden" name="mphb_adults" class="mphb-air-adults-input" value="<?php echo esc_attr( $adults ); ?>" />
			<input type="hidden" name="mphb_children" class="mphb-air-children-input" value="<?php echo esc_attr( $childrenAllowed ? $children : 0 ); ?>" />

			<div class="mphb-air-guests-pop" hidden>
				<div class="mphb-air-stepper" data-type="adults">
					<div class="mphb-air-stepper-text">
						<span class="mphb-air-stepper-label"><?php echo $childrenAllowed ? esc_html__( 'Adults', 'acs-site' ) : esc_html__( 'Guests', 'acs-site' ); ?></span>
					</div>
					<div class="mphb-air-stepper-ctrl">
						<button type="button" class="mphb-air-step mphb-air-step-minus" aria-label="<?php esc_attr_e( 'Decrease', 'acs-site' ); ?>">&minus;</button>
						<span class="mphb-air-step-value" data-value="<?php echo esc_attr( $adults ); ?>"><?php echo esc_html( $adults ); ?></span>
						<button type="button" class="mphb-air-step mphb-air-step-plus" aria-label="<?php esc_attr_e( 'Increase', 'acs-site' ); ?>">+</button>
					</div>
				</div>

				<?php if ( $childrenAllowed ) : ?>
					<div class="mphb-air-stepper" data-type="children">
						<div class="mphb-air-stepper-text">
							<span class="mphb-air-stepper-label"><?php esc_html_e( 'Children', 'acs-site' ); ?></span>
							<?php if ( ! empty( $childrenAgeText ) ) : ?>
								<span class="mphb-air-stepper-sub"><?php echo esc_html( $childrenAgeText ); ?></span>
							<?php endif; ?>
						</div>
						<div class="mphb-air-stepper-ctrl">
							<button type="button" class="mphb-air-step mphb-air-step-minus" aria-label="<?php esc_attr_e( 'Decrease', 'acs-site' ); ?>">&minus;</button>
							<span class="mphb-air-step-value" data-value="<?php echo esc_attr( $children ); ?>"><?php echo esc_html( $children ); ?></span>
							<button type="button" class="mphb-air-step mphb-air-step-plus" aria-label="<?php esc_attr_e( 'Increase', 'acs-site' ); ?>">+</button>
						</div>
					</div>
				<?php endif; ?>

				<button type="button" class="mphb-air-guests-done"><?php esc_html_e( 'Done', 'acs-site' ); ?></button>
			</div>
		</div>

		<button type="submit" class="mphb-air-submit" aria-label="<?php esc_attr_e( 'Search', 'acs-site' ); ?>">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.5" y2="16.5"></line></svg>
			<span><?php esc_html_e( 'Search', 'acs-site' ); ?></span>
		</button>
	</div>

	<div class="mphb-air-filters">
		<details class="mphb-air-amenities">
			<summary>
				<span class="mphb-air-amenities-label"><?php esc_html_e( 'Amenities', 'acs-site' ); ?></span>
				<?php if ( ! empty( $selAmen ) ) : ?>
					<span class="mphb-air-count"><?php echo esc_html( count( $selAmen ) ); ?></span>
				<?php endif; ?>
			</summary>
			<div class="mphb-air-amenities-list">
				<?php if ( empty( $amenities ) ) : ?>
					<p class="mphb-air-empty"><?php esc_html_e( 'No amenities defined yet.', 'acs-site' ); ?></p>
				<?php endif; ?>
				<?php foreach ( $amenities as $amenity ) : ?>
					<label class="mphb-air-check">
						<input type="checkbox" name="mphb_amenities[]" value="<?php echo esc_attr( $amenity->term_id ); ?>" <?php checked( in_array( $amenity->term_id, $selAmen, true ) ); ?> />
						<span><?php echo esc_html( $amenity->name ); ?></span>
					</label>
				<?php endforeach; ?>
			</div>
		</details>

		<label class="mphb-air-pets">
			<input type="checkbox" name="mphb_pets" value="1" <?php checked( $selPets ); ?> />
			<span><?php esc_html_e( 'Pets allowed', 'acs-site' ); ?></span>
		</label>
	</div>
</form>
