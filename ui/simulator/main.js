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
				$(this).text(''+value+'°F').css('border-color', color);
			}
		});
	}

	function applyDefaults() {
		setTemperature($('.temperature'), null);
		$('#car input[type="range"]').val(0);
		$('.info-group').hide();
		$('.sideview-mirror').css('transform', 'rotate(0deg)');
	}

	function applyPreferences(pref) {
		for (var key in pref) {
			if (key == 'temperate_seat_driver') {
				setTemperature($('.seat-temperature-driver'), parseInt(pref[key]));
			} else if (key == 'temperature') {
				setTemperature($('#ac-temperature'), parseInt(pref[key]));
			} else if (key == 'seat_position_driver') {
				$('#seat-position-driver').val(parseInt(pref[key]));
			} else if (key == 'sideview_mirror_left') {
				$('#sideview-mirror-left').css('transform', 'rotate('+pref[key]+'deg)');
			} else if (key == 'sideview_mirror_right') {
				$('#sideview-mirror-right').css('transform', 'rotate(-'+pref[key]+'deg)');
			} else if (key == 'radio') {
				$('#radio').show();
				$('#radio p').text(pref[key] + ' FM');
			} else if (key == 'destination') {
				$('#destination').show();
				$('#destination p').text(pref[key]);
			} else if (key == 'ecoMode') {
				$('#driving-mode').show();
				var text = pref[key];
				if (text == 'driveSport') {
					text = 'Sports Mode';
				}
				$('#driving-mode p').text(text);
			} else if (key == 'creepMode') {
				$('#creep-mode').show();
				var text = pref[key];
				if (text == 'creepOn') {
					text = 'Enabled';
				} else if (text == 'creepOff') {
					text = 'Disabled';
				}
				$('#creep-mode p').text(text);
			} else if (key == 'breakMode') {
				$('#break-mode').show();
				var text = pref[key];
				if (text == 'breakMedium') {
					text = 'Medium Breaks';
				} else if (text == 'breakHigh') {
					text = 'High Breaks';
				}
				$('#break-mode p').text(text);
			}
		}
	}

	applyDefaults();
	applyPreferences({
		temperate_seat_driver: '80',
		temperature: '60',
		radio: '98.5',
		seat_position_driver: '3',
		sideview_mirror_right: '41',
		sideview_mirror_left: '41',
		destination: 'Petuelring 130, Munich, Germany',
		ecoMode: 'driveSport',
		creepMode: 'creepOn',
		breakMode: 'breakHigh'
	});


	// var inbox = new ReconnectingWebSocket("ws://" + location.host + "/register");
	var sock = new WebSocket("ws://be-my-wife.herokuapp.com/register");

	sock.onmessage = function(event) {
		console.log('Incoming preferences!');
		var prefs = JSON.parse(event.data);
		console.log(prefs);
		applyDefaults();
		applyPreferences(prefs);
	};
});