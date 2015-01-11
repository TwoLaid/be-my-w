Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}

var temperature_scale = [240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255,/* 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270,*/ 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360];

$(document).ready(function() {

	function setTemperature($nodes, value) {
		var color;

		if (value != null) {
			var hue = Math.floor(value.map(30, 100, 0, temperature_scale.length));
			color = 'hsl(' + temperature_scale[hue] + ', 70%, 50%)';
		}

		$nodes.each(function() {
			if (value == null) {
				$(this).text('?').css({borderColor: 'black'});
			} else {

			}
			console.log(color);
			$(this).text(''+value+'°F').css('border-color', color);
		});
	}

	function applyDefaults() {
		setTemperature($('.temperature'), null);
		$('#car input[type="range"]').val(0);
	}

	function applyPreferences(pref) {
		for (var key in pref) {
			if (key == 'temperate_seat_driver') {
				setTemperature($('.seat-temperature-driver'), parseInt(pref[key]));
			} else if (key == 'temperature') {
				setTemperature($('#ac-temperature'), parseInt(pref[key]));
			}
		}
	}

	applyDefaults();
	applyPreferences({
		temperate_seat_driver: '80',
		temperature: '60'
	});

});