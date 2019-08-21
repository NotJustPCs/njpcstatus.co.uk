function servertest(cssid,htmlstr,colour) {
	document.getElementById(cssid).innerHTML = htmlstr;
	document.getElementById(cssid).style.color = colour;
}

function st_IPload() {servertest("st_IP","<i class='fa fa-check'></i> IP test Passed.","green");}
function st_IPerr() {servertest("st_IP","<i class='fa fa-times'></i> IP test Failed.","red");}
function st_HTTPload() {servertest("st_HTTP","<i class='fa fa-check'></i> HTTP test Passed.","green");}
function st_HTTPerr() {servertest("st_HTTP","<i class='fa fa-times'></i> HTTP test Failed.","red");}
function st_HTTPSload() {servertest("st_HTTPS","<i class='fa fa-check'></i> HTTPS test Passed.","green");}
function st_HTTPSerr() {servertest("st_HTTPS","<i class='fa fa-times'></i> HTTPS test Failed.","red");}

function ShowProgressMessage(msg) {
	if (console) {
		if (typeof msg == "string") {
			console.log(msg);
		} else {
			for (var i = 0; i < msg.length; i++) {
				console.log(msg[i]);
			}
		}
	}
	
	var oProgress = document.getElementById("st_DLSpeed");
	if (oProgress) {
		var actualHTML = (typeof msg == "string") ? msg : msg.join("<br />");
		oProgress.innerHTML = actualHTML;
	}
}

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
		ShowProgressMessage([speedMbps + " Mbps"
			//"Your connection speed is:", 
			//speedBps + " bps", 
			//speedKbps + " kbps", 
			//speedMbps + " Mbps"
		]);
	}
}

function LoadGeoIPVars(JSONdata) {
	var myJSON = JSON.stringify(JSONdata);
	var obj = JSON.parse(myJSON);
	document.getElementById('st_uIP').innerHTML = obj.ip;
//	document.getElementById('st_uISP').innerHTML = obj.organization;
//	document.getElementById('st_uOrg').innerHTML = obj.organization_name;
	console.log(obj.ip);
}

function getJSONP(url, success) {
    var ud = '_' + +new Date,
        script = document.createElement('script'),
        head = document.getElementsByTagName('head')[0] 
               || document.documentElement;
    window[ud] = function(data) {
        head.removeChild(script);
        success && success(data);
    };

    script.src = url.replace('callback=?', 'callback=' + ud);
    head.appendChild(script);
}
//getJSONP('https://api.ip.sb/jsonip', function(data){
//    console.log(data);
//    LoadGeoIPVars(data);
//});

$.ajax({
    type: "GET",
    url: "https://api-ipv4.ip.sb/geoip",
    dataType: "jsonp",
    success: function(json) {
        document.getElementById('st_uIP').innerHTML = json.ip;
	document.getElementById('st_uISP').innerHTML = json.city;
	document.getElementById('st_uOrg').innerHTML = json.organization;
    }
});
