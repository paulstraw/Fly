/*
 * Copyright (c) 2011 Paul Straw
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
 */

(function($) {
	$.fn.fly = function(opts) {
		var settings = $.extend({
			wrapperPos: 'relative',
			pictureSlider: true
		}, opts);

		return this.each(function() {
			var that = this,
				flyUl = $(that),
				wrapper = $('<div>').addClass('flyWrapper'),
				slides = flyUl.find('li'),
				activeSlide = slides.first().addClass('activeSlide'),
				maxLeft;

			settings.slideWidth = settings.slideWidth || flyUl.width();

			settings.afterChange = typeof settings.afterChange == 'function' ?
				settings.afterChange :
				null;

			wrapper.css({
				overflow: 'hidden',
				position: settings.wrapperPos,
				width: flyUl.width()
			});

			flyUl.wrap(wrapper).css({
				position: 'relative',
				width: settings.slideWidth * slides.length
			});

			//redefining wrapper because jQuery.wrap() clones elements
			wrapper = flyUl.parent();

			slides.css({
				float: 'left',
				width: settings.slideWidth
			});

			//resize wrapper height to fit the first slide
			if (settings.pictureSlider) {
				flyUl.find('img:first').bind('load', function() {
					wrapper.height($(this).height());
					//flyUl.height($(this).height());
				});

				//oh css, you crazy
				flyUl.find('img').css({
					width: settings.slideWidth,
					verticalAlign: 'bottom'
				});
			} else {
				wrapper.height(slides.eq(0).outerHeight());
				//flyUl.height(slides.eq(0).height());
			}

			maxLeft = - (settings.slideWidth * (slides.length - 1));

			//bind events for sliding junk
			if (slides.length > 1) {
				if ('ontouchstart' in window) {
					var touch = {},
						lastTouch,
						distanceX,
						distanceY,
						startX;

					flyUl.bind({
						touchstart: function(e) {
							e = e.originalEvent;

							//resets
							lastTouch = e.touches.length - 1;
							distanceX = 0;
							distanceY = 0;

							touch.x1 = e.touches[lastTouch].pageX;
							touch.y1 = e.touches[lastTouch].pageY;

							startX = touch.x1;
						},

						touchmove: function(e) {
							e = e.originalEvent;

							touch.x2 = e.touches[lastTouch].pageX;
							touch.y2 = e.touches[lastTouch].pageY;
							distanceX = touch.x1 - touch.x2;
							distanceY = Math.abs(touch.y1 - touch.y2);

							var absX = Math.abs(distanceX);

							if (absX > 2 || distanceY < 2) e.preventDefault();

							touch.x1 = touch.x2;
							touch.y1 = touch.y2;

							var curLeft = parseInt(flyUl.css('left'), 10);

							if (curLeft >= 0 && distanceX <= 0) { //stop at left end
								flyUl.css('left', 0);
								return;
							} else if (curLeft <= maxLeft && distanceX >= 0) { //stop at right end
								flyUl.css('left', maxLeft);
								return;
							}

							flyUl.css({
								left: curLeft - distanceX
							});
						},

						touchend: function(e) {
							e = e.originalEvent;

							var prev = activeSlide.prev(),
								next = activeSlide.next(),
								endX = e.changedTouches[e.changedTouches.length - 1].pageX,
								delta = Math.abs(startX - endX),
								dir = startX > endX ? 'next' : 'prev';

							if (delta > settings.slideWidth / 3) {
								if (dir == 'next' && next.length) {
									flyUl.animate({
										left: - next.position().left
									}, function() {
										wrapper.height(activeSlide.outerHeight());

										settings.afterChange && settings.afterChange(that);
									});
									activeSlide.removeClass('activeSlide');
									activeSlide = next.addClass('activeSlide');
								} else if (dir == 'prev' && prev.length) {
									flyUl.animate({
										left: - prev.position().left
									}, function() {
										wrapper.height(activeSlide.outerHeight());

										settings.afterChange && settings.afterChange(that);
									});
									activeSlide.removeClass('activeSlide');
									activeSlide = prev.addClass('activeSlide');
								}
							} else {
								flyUl.animate({
									left: - activeSlide.position().left
								});
							}
						}
					});
				} else {
					var nav = $('<a href="#" class="flyNav prevSlide"></a><a href="#" class="flyNav nextSlide"></a>').appendTo(wrapper);

					nav.bind({
						click: function(e) {
							e.preventDefault();

							var el = $(this);

							//don't let people slide while they're already sliding
							if (el.hasClass('sliding')) {
								return;
							}
							el.addClass('sliding');

							var dir = el.hasClass('prevSlide') ? 'prev' : 'next',
								curLeft = parseInt(flyUl.css('margin-left'), 10),
								newActive,
								newLeft;

							//TODO WHAT A MESS
							if (curLeft === 0 && dir == 'prev') {
								//go to last
								newActive = activeSlide.siblings().last();
								activeSlide.removeClass('activeSlide');
								activeSlide = newActive.addClass('activeSlide');

								newLeft = maxLeft;
							} else if (curLeft == maxLeft && dir == 'next') {
								//go to first
								newActive = activeSlide.siblings().first();
								activeSlide.removeClass('activeSlide');
								activeSlide = newActive.addClass('activeSlide');

								newLeft = 0;
							} else {
								//go in clicked direction
								newActive = dir == 'prev' ? activeSlide.prev() : activeSlide.next();
								activeSlide.removeClass('activeSlide');
								activeSlide = newActive.addClass('activeSlide');

								newLeft = curLeft + (dir == 'prev' ? + settings.slideWidth : - settings.slideWidth);
							}

							flyUl.animate({
								marginLeft: newLeft
							}, function() {
								el.removeClass('sliding');

								wrapper.height(activeSlide.outerHeight());

								settings.afterChange && settings.afterChange(that);
							});
						}
					});
				}
			}
		});
	};
}(jQuery));