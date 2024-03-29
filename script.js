GetDimensions();
document.getElementById('timer').innerHTML =
  05 + ":" + 00;
startTimer();

function startTimer() {
  var presentTime = document.getElementById('timer').innerHTML;
  var timeArray = presentTime.split(/[:]+/);
  var m = timeArray[0];
  var s = checkSecond((timeArray[1] - 1));
  if(s==59){m=m-1}
  //if(m<0){alert('timer completed')}
  
  document.getElementById('timer').innerHTML =
    m + ":" + s;
  setTimeout(startTimer, 1000);
}

function checkSecond(sec) {
  if (sec < 10 && sec >= 0) {sec = "0" + sec}; // add zero in front of numbers < 10
  if (sec < 0) {sec = "59"};
  return sec;
}

$(document).ready(function() {
	var config = {
		uptimerobot: {
			api_keys: [
				'm779473526-5938cd2054d3e62d02fb0439',
				'm777269574-df87adc1d43f9766f1bda566',
				//'m777269581-e4faa6662c749598d2ea8def',
				'm777297423-eeef70742f623e25e9c7c32c'
			],
			logs: 1
		},
		github: {
			org: 'NotJustPCs',
			repo: 'njpcstatus.co.uk'
		}
	};
	var status_text = {
		'operational': 'operational',
		'investigating': 'investigating',
		'major outage': 'outage',
		'degraded performance': 'degraded',
	};

	var monitors = config.uptimerobot.api_keys;
	for( var i in monitors ){
		var api_key = monitors[i];
		$.post('https://api.uptimerobot.com/v2/getMonitors', {
			"api_key": api_key,
			"format": "json",
			"logs": config.uptimerobot.logs,
		}, function(response) {
			status( response );
		}, 'json');
	}

	function status(data) {
		data.monitors = data.monitors.map(function(check) {
			check.class = check.status === 2 ? 'label-success' : 'label-danger';
			check.text = check.status === 2 ? 'operational' : 'major outage';
			if( check.status !== 2 && !check.lasterrortime ){
				check.lasterrortime = Date.now();
			}
			if (check.status === 2 && Date.now() - (check.lasterrortime * 1000) <= 86400000) {
				check.class = 'label-warning';
				check.text = 'degraded performance';
			}
			return check;
		});

		var status = data.monitors.reduce(function(status, check) {
			return check.status !== 2 ? 'danger' : 'operational';
		}, 'operational');

		if (!$('#panel').data('incident')) {
			$('#panel').attr('class', (status === 'operational' ? 'alert-success' : 'alert-warning') );
			$('#paneltitle').html(status === 'operational' ? 'All systems are operational.' : 'One or more systems inoperative');
		}
		data.monitors.forEach(function(item) {
			var name = item.friendly_name;
			var clas = item.class;
			var text = item.text;

			$('#services').append('<div class="list-group-item">'+
								'<span class="badge '+ clas + '">' + text + '</span>' +
								'<h4 class="list-group-item-heading">' + name + '</h4>' +
								'</div>');
		});
	};

	$.getJSON( 'https://api.github.com/repos/' + config.github.org + '/' + config.github.repo + '/issues?state=all' ).done(message);

	function message(issues) {
		issues.forEach(function(issue) {
			var status = issue.labels.reduce(function(status, label) {
				if (/^status:/.test(label.name)) {
					return label.name.replace('status:', '');
				} else {
					return status;
				}
			}, 'operational');

			var systems = issue.labels.filter(function(label) {
				return /^system:/.test(label.name);
			}).map(function(label) {
				return label.name.replace('system:', '')
			});

			if (issue.state === 'open') {
				$('#panel').data('incident', 'true');
				$('#panel').attr('class', (status === 'operational' ? 'alert-success' : 'alert-warning') );
				$('#paneltitle').html('<a href="#incidents">' + issue.title + '</a>');
			}

			var html = '<article class="timeline-entry">\n';
			html += '<div class="timeline-entry-inner">\n';

			if (issue.state === 'closed') {
				html += '<div class="timeline-icon bg-success"><i class="entypo-feather"></i></div>';
			} else {
				html += '<div class="timeline-icon bg-secondary"><i class="entypo-feather"></i></div>';
			}

			html += '<div class="timeline-label">\n';
			html += '<span class="date">' + datetime(issue.created_at) + '</span>\n';

			// status
			if (issue.state === 'closed') {
				html += '<span class="badge label-success pull-right">closed</span>';
			} else {
				html += '<span class="badge ' + (status === 'operational' ? 'label-success' : 'label-warn') + ' pull-right">';
				html += "open";
				html += '</span>\n';
			}

			// systems
			for (var i = 0; i < systems.length; i++) {
				html += '<span class="badge system pull-right">' + systems[i] + '</span>';
			}

			html += '<h2>' + issue.title + '</h2>\n';
			html += '<hr>\n';
			html += '<p>' + issue.body + '</p>\n';

			if (issue.state === 'closed') {
				html += '<p><em>Updated ' + datetime(issue.closed_at) + '<br/>';
				html += 'The system is back in normal operation.</p>';
			}
			html += '</div>';
			html += '</div>';
			html += '</article>';
			$('#incidents').append(html);
		});

		function datetime(string) {
			var datetime = string.split('T');

			var date = datetime[0];
			var time = datetime[1].replace('Z', '');

			return date + ' ' + time;
		};
	};
});
