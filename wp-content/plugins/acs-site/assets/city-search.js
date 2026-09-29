/* City search guests stepper and amenities dropdown (moved out of the MotoPress plugin folder). */
(function () {
	'use strict';

	function initGuests(root) {
		var toggle = root.querySelector('.mphb-air-guests-toggle');
		var pop = root.querySelector('.mphb-air-guests-pop');
		var summaryEl = root.querySelector('.mphb-air-guests-summary');
		var adultsInput = root.querySelector('.mphb-air-adults-input');
		var childrenInput = root.querySelector('.mphb-air-children-input');
		if (!toggle || !pop) { return; }

		var minAdults = parseInt(root.getAttribute('data-min-adults'), 10) || 1;
		var maxAdults = parseInt(root.getAttribute('data-max-adults'), 10) || 30;
		var maxChildren = parseInt(root.getAttribute('data-max-children'), 10) || 0;
		var childrenAllowed = root.getAttribute('data-children-allowed') === '1';

		function val(type) {
			var el = pop.querySelector('.mphb-air-stepper[data-type="' + type + '"] .mphb-air-step-value');
			return el ? parseInt(el.getAttribute('data-value'), 10) || 0 : 0;
		}
		function setVal(type, n) {
			var el = pop.querySelector('.mphb-air-stepper[data-type="' + type + '"] .mphb-air-step-value');
			if (el) { el.setAttribute('data-value', n); el.textContent = n; }
		}
		function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

		function refresh() {
			var a = val('adults');
			var c = childrenAllowed ? val('children') : 0;
			adultsInput.value = a;
			childrenInput.value = c;

			var text;
			if (childrenAllowed) {
				text = plural(a, 'adult', 'adults');
				if (c > 0) { text += ', ' + plural(c, 'child', 'children'); }
			} else {
				text = plural(a, 'guest', 'guests');
			}
			summaryEl.textContent = text;

			// Enable/disable buttons at limits.
			updateButtons('adults', a, minAdults, maxAdults);
			if (childrenAllowed) { updateButtons('children', c, 0, maxChildren); }
		}

		function updateButtons(type, n, min, max) {
			var stepper = pop.querySelector('.mphb-air-stepper[data-type="' + type + '"]');
			if (!stepper) { return; }
			stepper.querySelector('.mphb-air-step-minus').disabled = n <= min;
			stepper.querySelector('.mphb-air-step-plus').disabled = n >= max;
		}

		pop.addEventListener('click', function (e) {
			var btn = e.target.closest('.mphb-air-step');
			if (btn) {
				var stepper = btn.closest('.mphb-air-stepper');
				var type = stepper.getAttribute('data-type');
				var min = type === 'adults' ? minAdults : 0;
				var max = type === 'adults' ? maxAdults : maxChildren;
				var cur = val(type);
				if (btn.classList.contains('mphb-air-step-plus') && cur < max) { setVal(type, cur + 1); }
				if (btn.classList.contains('mphb-air-step-minus') && cur > min) { setVal(type, cur - 1); }
				refresh();
				return;
			}
			if (e.target.closest('.mphb-air-guests-done')) {
				close();
			}
		});

		function open() {
			pop.hidden = false;
			toggle.setAttribute('aria-expanded', 'true');
			root.classList.add('is-open');
		}
		function close() {
			pop.hidden = true;
			toggle.setAttribute('aria-expanded', 'false');
			root.classList.remove('is-open');
		}
		toggle.addEventListener('click', function (e) {
			e.preventDefault();
			pop.hidden ? open() : close();
		});
		document.addEventListener('click', function (e) {
			if (!root.contains(e.target)) { close(); }
		});

		refresh();
	}

	function init() {
		document.querySelectorAll('.mphb-air-guests').forEach(initGuests);

		// Close the amenities dropdown when clicking outside of it.
		document.addEventListener('click', function (e) {
			document.querySelectorAll('details.mphb-air-amenities[open]').forEach(function (d) {
				if (!d.contains(e.target)) { d.removeAttribute('open'); }
			});
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
