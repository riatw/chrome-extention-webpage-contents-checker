var isIFrame = window.top != window;
var ErrorFlag = 0;
var ErrorArray = [];

document.addEventListener('ErrorToExtension', function(e) {
	ErrorFlag = 1;
	ErrorArray.push(e);
});

function codeToInject() {
	function handleUserError(text) {
		var e = new Error();
		var stack = e.stack.split("\n");
		var callSrc = (stack.length > 3 && (/^.*?\((.*?):(\d+):(\d+)/.exec(stack[3]) || /(\w+:\/\/.*?):(\d+):(\d+)/.exec(stack[3]))) || [null, null, null, null];
		delete stack[1];
		delete stack[2];

		document.dispatchEvent(new CustomEvent('ErrorToExtension', {
			detail: {
				stack: stack.join("\n"),
				url: callSrc[1],
				line: callSrc[2],
				col: callSrc[3],
				text: text
			}
		}));
	}

	// handle console.error()
	var consoleErrorFunc = window.console.error;
	window.console.error = function() {
		var argsArray = [];
		for(var i in arguments) { // because arguments.join() not working! oO
			argsArray.push(arguments[i]);
		}
		consoleErrorFunc.apply(console, argsArray);
		handleUserError(argsArray.join(' '));
	};

	// handle uncaught errors
	window.addEventListener('error', function(e) {
		if(e.filename) {
			document.dispatchEvent(new CustomEvent('ErrorToExtension', {
				detail: {
					stack: e.error ? e.error.stack : null,
					url: e.filename,
					line: e.lineno,
					col: e.colno,
					text: e.message
				}
			}));
		}
	});

	// handle 404 errors
	window.addEventListener('error', function(e) {
		var src = e.target.src || e.target.href;
		var baseUrl = e.target.baseURI;

		if(src && baseUrl && src != baseUrl) {
			document.dispatchEvent(new CustomEvent('ErrorToExtension', {
				detail: {
					is404: true,
					url: src
				}
			}));
		}
	}, true);
}

var script = document.createElement('script');
script.textContent = '(' + codeToInject + '())';
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

$(document).ready(function(){
	chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
		if (request.method == "getHTML") {
			sendResponse($("html").html());
		}

		if ( request.method == "highlight" ) {
			var children = $("body").children();
			var c_regP = new RegExp("(" + request.pattern + ")", "gm");

			$(".highlight").contents().unwrap();

			children.find("script").remove();

			children.not("script,style").each(function(){
				body = $(this).html();

				// セーフリストのものを除外する
				var safeArray = request.safechar.split("|");

				for ( var i=0; i<safeArray.length; i++ ) {
					var safeChar = new RegExp("(" + safeArray[i] + ")", "gm");
					var escapeSafeChar = escape(safeArray[i]);

					body = body.replace(safeChar,escapeSafeChar);
				}

				//NGパターンをハイライト
				body = body.replace( c_regP ,"<span class='highlight' style='background: orange;'>$1</span>");

				// セーフリストのものを元に戻す
				for ( var i=0; i<safeArray.length; i++ ) {
					var safeChar = new RegExp("(" + escape(safeArray[i]) + ")", "gm");
					var escapeSafeChar = safeArray[i].replace(/\\/gm,"");

					body = body.replace(safeChar,escapeSafeChar);
				}

				$(this).html(body);
			});
		}

		if (request.method == "checkConsoleError") {
			sendResponse( ErrorFlag );
		}
	});
});
