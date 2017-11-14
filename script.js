$(document).ready(function() {
	var config = {
		uptimerobot: {
			api_keys: [
				'm779473526-5938cd2054d3e62d02fb0439',
				'm777269581-e4faa6662c749598d2ea8def',
				'm777297423-eeef70742f623e25e9c7c32c'
			],
			logs: 1
		},
		github: {
			org: 'NotJustPCs',
			repo: 'status.notjustpcs.co.uk'
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

function servertest(cssid,htmlstr,colour) {
	document.getElementById(cssid).innerHTML = htmlstr;
	document.getElementById(cssid).style.color = colour;
}

function st_IPload() {servertest("st_IP","<i class='fa fa-check'></i> Your computer can access the webserver via IP address.","green");}
function st_IPerr() {servertest("st_IP","<i class='fa fa-times'></i> Your computer cannot access the webserver via IP address.","red");}
function st_HTTPload() {servertest("st_HTTP","<i class='fa fa-check'></i> Your computer can access the webserver via hostname (HTTP).","green");}
function st_HTTPerr() {servertest("st_HTTP","<i class='fa fa-times'></i> Your computer cannot access the webserver via hostname (HTTP).","red");}
function st_HTTPSload() {servertest("st_HTTPS","<i class='fa fa-check'></i> Your computer can access the webserver via hostname (HTTPS).","green");}
function st_HTTPSerr() {servertest("st_HTTPS","<i class='fa fa-times'></i> Your computer cannot access the webserver via hostname (HTTPS).","red");}

function MeasureConnectionSpeed() {
	var startTime, endTime;
	var download = new Image();
	download.onload = function () {
		endTime = (new Date()).getTime();
		showResults();
	}
	
	download.onerror = function (err, msg) {
		ShowProgressMessage("<i class='fa fa-times'></i> Image not found or corrupt.");
	}
	
	startTime = (new Date()).getTime();
	var cacheBuster = "?nnn=" + startTime;
	download.src = imageAddr + cacheBuster;
	
	function showResults() {
		var duration = (endTime - startTime) / 1000;
		var bitsLoaded = downloadSize * 8;
		var speedBps = (bitsLoaded / duration).toFixed(2);
		var speedKbps = (speedBps / 1024).toFixed(2);
		var speedMbps = (speedKbps / 1024).toFixed(2);
		ShowProgressMessage([
			//"Your connection speed is:", 
			//speedBps + " bps", 
			//speedKbps + " kbps", 
			//speedMbps + " Mbps"
			"<i class='fa fa-cloud-download'></i> <a id='st_m_DLS'>Your connection speed is currently: " + speedMbps + " Mbps</a>"
		]);
	}
}
