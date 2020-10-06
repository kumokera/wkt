//要素内のクリックされた位置を取得するグローバル（のような）変数
var posOffsetX;
var posOffsetY;
var drag = null;
var cards = [];
var cardUIs = [];
var cardWidth = 150;
var cardHeight = 80;
var isEditMode = false;
var mousePosX = 0;
var mousePosY = 0;
var currentEditing;
var modal;
var modalTitle;
var modalDescription;
var currentHover;
var isInputLocked = false;
var dragStartX;
var dragStartY;
var lastMovementX = 0;
var lastMovementY = 0;
var toolTipUI;
var panelMerginX = 750;
var panelMerginY = 1000;
var windowWidth;
var windowHeight;
var logStrArray = [];
onStart();

function onStart() {
    //UI要素の検索
    modal = document.getElementById("modal-overlay");
    modalTitle = document.getElementById("modal-title");
    modalDescription = document.getElementById("modal-description");
    toolTipUI = document.getElementById("tool-tip");

    isEditMode = false;
    modal.style.display = "none";
    refreshDraggable();

    document.onkeyup = function (keyEvent) {
        var e = keyEvent;
        if (e.key === '.') {
            isInputLocked = false;
        }
    }
    document.onkeydown = function (keyEvent) {
        var e = keyEvent;
        if (isEditMode) {
            if (e.key === "Enter" && e.ctrlKey) {
                confirmEdit();
            }
            if (e.key === "Escape") {
                cancelEdit();
                e.preventDefault();
            }
            if (e.key === '.') {
                if (isInputLocked) {
                    e.preventDefault();
                }
            }

        } else {
            if (e.key === 'a') {
                addCard(true);
            }
            if (e.key === 'r' && drag == null) {
                reloadCards();
            }
            if (currentHover != null && drag == null) {
                if (e.key === '.') {
                    e.preventDefault();
                    isInputLocked = true;
                    edit(currentHover);
                }
                if (e.key === 'q') {
                    removeCard(currentHover);
                }
                if (e.key === 'j') {
                    if (e.shiftKey) {
                        copyAll();
                    } else {
                        if (e.altKey) {
                            copyTitle();
                        } else {
                            copyDescription();
                        }
                    }
                }
            }
            if (e.key === 's' && e.ctrlKey) {
                e.preventDefault();
                navigator.clipboard.writeText(JsonFromCards());
                logAdd("O:クリップボードにJsonを保存");
                outputTextFile();
            }
        }
    }

    //右クリック
    document.onmousedown = function (e) {
        if (e.button == 2) {
            e.preventDefault();
            if (isEditMode) {
                confirmEdit();
            }
        }
    }
    //マウスの移動時に、dragしている場合、位置を更新
    document.onmousemove = function (oPssevt2) {
        var omsEvent2 = oPssevt2;
        mousePosX = omsEvent2.clientX;
        mousePosY = omsEvent2.clientY;
        var scrollPosX = window.scrollX;
        var scrollPosY = window.scrollY;
        if (drag != null) {
            drag.style.left = String(omsEvent2.clientX - posOffsetX + scrollPosX) + "px";
            drag.style.top = String(omsEvent2.clientY - posOffsetY + scrollPosY) + "px";
            var index = cardUIs.indexOf(drag);
            cards[index].top = drag.style.top;
            cards[index].left = drag.style.left;
        }
    }
    //ペーストを使ったデータの保存
    document.addEventListener('paste', function (e) {
        if (!isEditMode) {
            if (currentHover) {
                e.preventDefault();
                pasteAll(e.clipboardData.getData('text'));
                logAdd("カード情報を反映");
            } else {
                e.preventDefault();
                try {
                    readFromString(e.clipboardData.getData('text'));
                    logAdd("O:CBテキストをJsonとして読み込み");
                } catch (error) {
                    //parseできない場合の処理
                    logAdd("E:テキストのJson化に失敗");
                }
                cancelEdit();
            }
        }
    });
    //file drag関係
    document.addEventListener('dragover', function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy'; showDropping();
    });
    document.addEventListener('dragleave', function (event) {
        hideDropping();
    });
    document.addEventListener('drop', function (event) {
        event.preventDefault();
        hideDropping();

        var files = event.dataTransfer.files;
        readFiles(files)
    });
}
function readFiles(files) {
    //複数ドロップの場合、最初のファイルを読む
    var file = files[0];
    logAdd("O: テキスト読み込み" + '(' + file.name + ')' + file.type + ',' + file.size + 'bytes)');
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (ev) {
        logAdd("O: テキスト読み込み完了");
        readFromString(reader.result);
    }
}
function showDropping() { }
function hideDropping() { }
function readFromString(str) {
    cards = JSON.parse(str);
    cancelEdit();
}
function JsonFromCards() {
    var jsonString = JSON.stringify(cards);
    return (jsonString);
}
function outputTextFile() {
    let blob = new Blob([JsonFromCards()], { type: "text/plan" });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '寝台特急プレアデスの悪夢.text';
    link.click();
}
function saveCardChange(index, title, description) {
    if (title != null) {
        cards[index].title = title
    }
    if (description != null) {
        cards[index].description = description;
    }
}
//最も端にあるカードの位置を元にrelativeDivを拡大
function resizeCampus() {
    var maxX = 0;
    var maxY = 0;
    //最も左上から遠いカードの位置
    for (var i = 0; i < cards.length; i++) {
        if (maxX < parseInt(cards[i].left.split("px")[0], 10)) {
            maxX = parseInt(cards[i].left.split("px")[0], 10);
        }
        if (maxY < parseInt(cards[i].top.split("px")[0], 10)) {
            maxY = parseInt(cards[i].top.split("px")[0], 10);
        }
    }
    if (maxX != 0 && maxY != 0) {
        var panel = document.getElementById("relative");
        panel.style.width = (maxX + panelMerginX) + "px";
        panel.style.height = (maxY + panelMerginY) + "px";
    }
}
function copyDescription() {
    navigator.clipboard.writeText(currentHover.children[1].innerHTML);
}
function copyTitle() {
    navigator.clipboard.writeText(currentHover.children[0].innerHTML);
}
function copyAll() {
    navigator.clipboard.writeText(currentHover.children[0].innerHTML + "\n" + currentHover.children[1].innerHTML);
}
function pasteDescription(t) {
    currentHover.children[1].innerHTML = t;
}
function pasteTitle() {
}
function pasteAll(t) {
    var i = t.indexOf("\n");
    saveCardChange(cardUIs.indexOf(currentHover), t.slice(0, i), t.slice(i + 1));
    reloadCards();
}

function getTitle() {
    var x = document.getElementById("modal-title").value;
}
function addCard(enableLog, c) {
    var cardUI = document.createElement("DIV");
    cardUI.classList.add('drag-and-drop');
    cardUI.classList.add('black-card');
    var title = document.createElement("DIV");
    var description = document.createElement("DIV");
    title.className = 'card-title'
    description.className = 'card-description';
    cardUI.appendChild(title);
    cardUI.appendChild(description);
    document.body.appendChild(cardUI);
    if (c) {
        if (c.title) {
            title.innerHTML = c.title;
        }
        if (c.description) {
            description.innerHTML = c.description;
        }
        if (c.left && c.top) {
            cardUI.style.left = Math.max(0, parseInt(c.left.replace("px", ""), 10)) + "px";
            cardUI.style.top = Math.max(0, parseInt(c.top.replace("px", ""), 10)) + "px";
        }
    } else {
        cards.push(new Card(cardUI.style.left, cardUI.style.top, "", ""));
        cards.title = "";
        cards.description = "";
        //カードの位置を左・上方向に出ないようClamp
        cardUI.style.left = Math.max(0, mousePosX - cardWidth / 2) + "px";
        cardUI.style.top = Math.max(0, mousePosY - cardHeight / 2) + "px";
        cards[cards.length - 1].left = cardUI.style.left;
        cards[cards.length - 1].top = cardUI.style.top;
    }
    cardUIs.push(cardUI);
    refreshDraggable();
    if (enableLog) {
        logAdd("O:CardAdded");
    }
}
function reloadCards() {
    for (var i = 0; i < cardUIs.length; i++) {
        document.body.removeChild(cardUIs[i]);
    }
    cardUIs = [];
    for (var i = 0; i < cards.length; i++) {
        addCard(false, cards[i]);
    }
}

function refreshDraggable() {
    cardUIs = [];
    //要素の取得
    var elements = document.getElementsByClassName("drag-and-drop");
    //マウスが要素内で押されたとき、又はタッチされたとき発火
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("mousedown", mdown, false);
        elements[i].addEventListener("mouseenter", menter, false);
        elements[i].addEventListener("mouseleave", mleave, false);
        cardUIs.push(elements[i]);
    }
    resizeCampus();
}

//カード編集関係
function edit(editing) {
    currentEditing = editing;
    isEditMode = true;
    modal.style.display = "block";
    modalTitle.value = currentEditing.children[0].innerHTML;
    modalDescription.value = currentEditing.children[1].innerHTML;
    modalTitle.focus();
    modalTitle.addEventListener('keydown', function () {
        if (isInputLocked) {
            event.preventDefault();
        }
    });
}
function confirmEdit() {
    var index = cardUIs.indexOf(currentEditing);
    cards[index].title = modalTitle.value;
    cards[index].description = modalDescription.value;
    isEditMode = false;
    modal.style.display = "none";
    //currentEditing.children[0].innerHTML = modalTitle.value;
    //currentEditing.children[1].innerHTML = modalDescription.value;
    reloadCards();
}

function cancelEdit() {
    isEditMode = false;
    modal.style.display = "none";
    reloadCards();
}

function removeCard(e) {
    toolTipUI.style.display = "none";
    index = cardUIs.indexOf(e);
    if (index >= 0) {
        cardUIs.splice(index, 1);
        document.body.removeChild(e);
        cards.splice(index, 1);
        logAdd("O:CardRemoved")
    } else {
        logAdd("E:削除対象のカードがcardUIsに存在しない");
    }
    currentHover = null;
}

function menter(e) {
    currentHover = this;
    this.addEventListener("mousemove", toolTipUpdate, false);
}
function toolTipUpdate() {
    if (drag == null) {
        //windowSizeを更新
        windowWidth = document.documentElement.clientWidth;
        windowHeight = document.documentElement.clientHeight;

        //toolTipUIを表示
        toolTipUI.style.display = "block";

        //html内の改行のため、文字列操作
        var str = cards[cardUIs.indexOf(currentHover)].description;
        //一応タグを使えないように置き換える
        str = str.split("<").join("&lt;");
        str = str.split(">").join("&gt;");
        //改行を改行タグに置き換える
        str = str.split("\n").join("<br>");
        toolTipUI.innerHTML = str;
        toolTipWidth = toolTipUI.clientWidth;
        toolTipHeight = toolTipUI.clientHeight;

        if (event.pageX + toolTipWidth < windowWidth) {
            toolTipUI.style.left = event.pageX + "px";
        } else {
            //端から出る場合、カーソルの左側にpopさせる
            toolTipUI.style.left = (event.pageX - toolTipWidth) + "px";
        }
        if (event.pageY + toolTipHeight < windowHeight) {
            toolTipUI.style.top = event.pageY + "px";
        } else {
            //端から出る場合、カーソルの上側にpopさせる
            toolTipUI.style.top = event.pageY + "px";
            toolTipUI.style.top = (event.pageY + toolTipHeight) + "px";
        }

    } else {
        toolTipUI.style.display = "none";
    }

}
function mleave(e) {
    currentHover = null;
    this.removeEventListener("mousemove", toolTipUpdate), false;
    toolTipUI.style.display = "none";
    toolTipUI.innerHTML = "";
}
//マウスが押された際の関数
function mdown(e) {
    if (e.button == 0) {
        //クラス名に .drag を追加
        this.classList.add("drag");
        //ドラッグしている要素を取得
        drag = document.getElementsByClassName("drag")[0];

        //要素内の相対座標を取得
        posOffsetX = event.pageX - this.offsetLeft;
        posOffsetY = event.pageY - this.offsetTop;
        dragStartX = event.pageX;
        dragStartY = event.pageY;

        //ムーブイベントにコールバック
        drag.addEventListener("mouseup", mup, false);
    }
}

//マウスボタンが上がったら発火
function mup(e) {
    //ムーブベントハンドラの消去
    //document.body.removeEventListener("mousemove", mmove, false);
    drag.removeEventListener("mouseup", mup, false);

    //クラス名 .drag も消す
    drag.classList.remove("drag");
    drag = null;
    if (dragStartX === event.pageX && dragStartY === event.pageY) {
        edit(currentHover);
    }
    resizeCampus();
}

function logAdd(str) {
    if (logStrArray.length > 12) {
        logStrArray.shift();
    }
    var logStr = "";
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    if (parseInt(hours, 10) < 10) {
        hours = "0" + hours;
    }
    if (parseInt(minutes, 10) < 10) {
        minutes = "0" + minutes;
    }
    if (parseInt(seconds, 10) < 10) {
        seconds = "0" + seconds;
    }
    logStr += hours + ":" + minutes + ":" + seconds;
    logStr += "　" + str;
    logStr += "<br>";
    logStrArray.push(logStr);
    var logUI = document.getElementById("log");
    logUI.innerHTML = logStrArray.join("");
}


//カードデータ保持用クラス
class Card {
    constructor(left, top, title, description) {
        this.left = left;
        this.top = top;
        this.title = title;
        this.description = description;
        //this.index = index;
    }
}