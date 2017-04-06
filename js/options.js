/* MEMO
	BackGround(Event) Page = 後ろで動いているページ（権限強い、DOMアクセス不可）
	ContentScripts = 指定したドメインで読み込まれる追加JS（権限弱い、DOMアクセス可）
	BrowserAction = タスクバーから実行されるポップアップ（権限普通、DOMアクセス不可）
	http://www.apps-gcp.com/calendar-extension/
*/

$(document).ready(function()　{
	var list = $("[data-list]");
	var listItem = list.children();
	var addBtn = $("[data-add]");
	var saveBtn = $("[data-save]");
	var removeBtn = $("[data-remove]");
	var importBtn = $("[data-import");
	var exportBtn = $("[data-export");
	var exportForm = $("[data-export-raw]");
	var resetBtn = $("[data-reset]");

	var setting = localStorage.getItem("setting");
	var tmpl = $("[data-tmpl").html();

	if ( setting ) {
		exportForm.val(setting);

		try {
			setting = JSON.parse(setting);
		} catch(e) {
			setting = [];
		}
	}
	else {
		setting = [];
	}

	// recover
	for ( var i=0; i < setting.length; i++ ) {
		var current = setting[i];
		var $tmpl = $(tmpl);

		for(var key in current){
			var selector = "[data-name=" + key + "]";
			$tmpl.find(selector).val(current[key]);
		}

		$tmpl.appendTo(list);
	}

	// add
	addBtn.click(function() {
		list.append(tmpl);
	});

	// save
	saveBtn.click(function(){
		setting = [];

		list.children().each( function() {
			var $this = $(this);
			var obj = {};

			$this.find("[data-name]").each(function() {
				var label = $(this).data("name");
				var attr = $(this).val();

				obj[label] = attr;
			});

			setting.push(obj);
		});

		localStorage.setItem("setting", JSON.stringify(setting));

		alert("保存が完了しました");
	});

	importBtn.click(function() {
		var importData = window.prompt("インポートデータを入力してください");

		if ( importData != null && importData != "" ) {
			localStorage.setItem("setting", importData);
		}

		location.reload();
	});

	exportBtn.click(function() {
		$("[data-export-box]").show();
	});

	// remove
	$(document).on("click", "[data-item-remove]", function() {
		$(this).parents("[data-list-item]").remove();
	});
});
