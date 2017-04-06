/* MEMO
	BackGround(Event) Page = 後ろで動いているページ（権限強い、DOMアクセス不可）
	ContentScripts = 指定したドメインで読み込まれる追加JS（権限弱い、DOMアクセス可）
	BrowserAction = タスクバーから実行されるポップアップ（権限普通、DOMアクセス不可）
	http://www.apps-gcp.com/calendar-extension/
*/

function clearBuff() {
	$target = $("#buff");

	$target.text("");
}

function writeToBuff(text) {
	$target = $("#buff");

	$target.text( $target.text() + text );
}

$(document).ready(function(){
	//データ移行モード
	var oldFlag = localStorage.getItem("ngurl");

	if ( oldFlag ) {
		var setting = [];

		setting.push({
			"global_sitename": "既定のサイト",
			"test1_ngurl": localStorage.getItem("ngurl"),
			"test2_ngchar": localStorage.getItem("ngchar"),
			"test2_safechar": localStorage.getItem("safechar")
		});

		localStorage.setItem("setting", JSON.stringify(setting));

		localStorage.removeItem("ngurl");
		localStorage.removeItem("ngchar");
		localStorage.removeItem("safechar");
	}

	//選択値の自動保存
	$("[data-autosave]").each(function() {
		var name = $(this).attr("name");

		if ( localStorage.getItem(name) ) {
			$(this).val( localStorage.getItem(name) );
		}
	});

	$("[data-autosave]").blur(function() {
		var name = $(this).attr("name");

		localStorage.setItem( name, $(this).val() );
	});

	//設定値を復元
	$("[data-setting]").each(function() {
		var urls = localStorage.getItem("setting");

		if ( urls ) {
			urls = JSON.parse(urls);
		}
		else {
			urls = [];
		}

		for ( var i=0; i<urls.length; i++ ) {
			var current = urls[i];
			var $option = $("<option />");

			$option.attr("value", current.global_sitename);
			$option.text(current.global_sitename);

			$option.appendTo($(this));
		}

		$(this).val( localStorage.getItem("profile") );
	});

	$("[data-setting]").change(function() {
		var urls = localStorage.getItem("setting");
		var currentval = $(this).val();

		if ( urls ) {
			urls = JSON.parse(urls);
		}
		else {
			urls = [];
		}

		for ( var i=0; i<urls.length; i++ ) {
			if ( currentval == urls[i].global_sitename ) {
				$("#test1_ngurl").val( urls[i].test1_ngurl );
				$("#test2_ngchar").val( urls[i].test2_ngchar );
				$("#test2_safechar").val( urls[i].test2_safechar );
			}
		}
	});

	$("[data-setting]").change();

	// チェック実行
	$("#docheck").click(function() {
		var ngurl = $("#test1_ngurl").val();
		var ngchar = $("#test2_ngchar").val().replace(/[-\/\\^$*+?.()[\]{}]/g,'\\$&');
		var safechar = $("#test2_safechar").val().replace(/[-\/\\^$*+?.()[\]{}]/g,'\\$&');

		//出力初期化
		clearBuff();

		//チェック実行
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, { method: "getHTML" }, function(response) {
				var html = response;

				//test1: NG Domain is found ?
				writeToBuff("[テスト1] NGドメインが含まれていないか");

				if ( html.indexOf(ngurl) == -1 ) {
					writeToBuff(" [OK]\n\n");
				}
				else {
					writeToBuff(" [NG]\n\n");
				}

				//test2: ng chars is found ?
				writeToBuff("[テスト2] NG文字が含まれていないか");

				var c_regP = new RegExp(ngchar, "gm");
				var safeArray = safechar.split("|");

				for ( var i=0; i<safeArray.length; i++ ) {
					var safeChar = new RegExp("(" + safeArray[i] + ")", "gm");
					var escapeSafeChar = escape(safeArray[i]);

					html = html.replace(safeChar,escapeSafeChar);
				}

				if( ! html.match(c_regP) ){
					writeToBuff(" [OK]\n\n");
				}
				else {
					writeToBuff(" [NG]\n\n");
					writeToBuff( "以下の文字が含まれています:" + html.match(c_regP).join(",") + "\n\n" );

					chrome.tabs.sendMessage(tabs[0].id, { method: "highlight", pattern: ngchar,safechar: safechar }, function(response) {});
				}

				// test1: NG Domain is found ?
				writeToBuff("[テスト3] コンソールエラーが発生していないか");

				chrome.tabs.sendMessage(tabs[0].id, { method: "checkConsoleError" }, function(response) {
					if ( ! response ) {
						writeToBuff(" [OK]\n\n");
					}
					else {
						writeToBuff(" [NG]\n\n");
					}
				});
			});
		});
	});
});
