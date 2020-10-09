"use strict";
exports.__esModule = true;
var ncmbMin = require("./ncmb.min.js");
//カードデータ保持用クラス
var Card = /** @class */ (function () {
    function Card(left, top, title, description) {
        this.left = left;
        this.top = top;
        this.title = title;
        this.description = description;
    }
    return Card;
}());
var posOffsetX;
var posOffsetY;
var drag = null;
var cards;
var cardUIs;
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
var panelMarginX = 750;
var panelMarginY = 1000;
var windowWidth;
var windowHeight;
var logStrArray = [];
console.log("test");
var TestClass;
var scenarioName = "寝台特急プレアデスの悪夢";
onStart();
function saveToNCMB() {
    TestClass.equalTo("scenarioName", scenarioName)
        .order("createDate", true)
        .fetchAll()
        .then(function (results) {
        logAdd("O:NCMBからシナリオを取得");
        var object = results[0];
        object.set("cards", JsonFromCards())
            .update()
            .then(function (object) {
            logAdd("O:NCMBのデータを更新しました");
        });
    })["catch"](function (err) {
        logAdd("E:NCMBからシナリオの取得に失敗しました");
        var newObject = new TestClass();
        newObject.set("scenarioName", scenarioName)
            .set("cards", JsonFromCards())
            .save()
            .then(function (newObject) {
            logAdd("O:NCMBにシナリオを新規保存");
        })["catch"](function (err) {
            logAdd("E:NCMBへの新規保存に失敗しました");
        });
    });
}
function loadFromNCMB() {
    TestClass.equalTo("scenarioName", scenarioName)
        .order("createDate", true)
        .fetchAll()
        .then(function (results) {
        logAdd("O:NCMBからシナリオを取得");
        var object = results[0];
        readFromString(object.cards);
        cancelEdit();
    })["catch"](function (err) {
        logAdd("E:NCMBからシナリオの取得に失敗しました");
    });
}
function onStart() {
    //UI要素の検索
    modal = document.getElementById("modal-overlay");
    modalTitle = document.getElementById("modal-title");
    modalDescription = document.getElementById("modal-description");
    toolTipUI = document.getElementById("tool-tip");
    refreshDraggable();
    cancelEdit();
    var ncmb = new ncmbMin.NCMB("d3a5264ba3539f638997cf8d8bb38e4a12d0bb45284acc309fcf57c94819ea87", "e21485631b01f398f7c322575b6ae2907e2df1248c1bde1305b45f62503842d9");
    TestClass = ncmb.DataStore("TestClass");
    loadFromNCMB();
    document.onkeyup = function (keyEvent) {
        var e = keyEvent;
        if (e.key === '.') {
            isInputLocked = false;
        }
    };
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
        }
        else {
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
                    }
                    else {
                        if (e.altKey) {
                            copyTitle();
                        }
                        else {
                            copyDescription();
                        }
                    }
                }
            }
            if (e.key === 's' && e.ctrlKey) {
                e.preventDefault();
                if (JsonFromCards) {
                    navigator.clipboard.writeText(JsonFromCards());
                    //logAdd("O:クリップボードにJsonを保存");
                    saveToNCMB();
                    //outputTextFile();
                }
                else {
                    logAdd("JsonError");
                }
            }
        }
    };
    //右クリック
    document.onmousedown = function (e) {
        if (e.button == 2) {
            e.preventDefault();
            if (isEditMode) {
                confirmEdit();
            }
        }
    };
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
            cards[index].top = numberFromPx(drag.style.top);
            cards[index].left = numberFromPx(drag.style.left);
        }
    };
    //ペーストを使ったデータの保存
    document.addEventListener('paste', function (e) {
        if (!isEditMode) {
            if (currentHover) {
                e.preventDefault();
                pasteAll(e.clipboardData.getData('text'));
                logAdd("カード情報を反映");
            }
            else {
                e.preventDefault();
                try {
                    readFromString(e.clipboardData.getData('text'));
                    logAdd("O:CBテキストをJsonとして読み込み");
                }
                catch (error) {
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
        event.dataTransfer.dropEffect = 'copy';
        showDropping();
    });
    document.addEventListener('dragleave', function (event) {
        hideDropping();
    });
    document.addEventListener('drop', function (event) {
        event.preventDefault();
        hideDropping();
        var files = event.dataTransfer.files;
        readFiles(files);
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
    };
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
    var blob = new Blob([JsonFromCards()], { type: "text/plan" });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '寝台特急プレアデスの悪夢.text';
    link.click();
}
function saveCardChange(index, title, description) {
    if (title != null) {
        cards[index].title = title;
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
        if (maxX < cards[i].left) {
            maxX = cards[i].left;
        }
        if (maxY < cards[i].top) {
            maxY = cards[i].top;
        }
    }
    if (maxX != 0 && maxY != 0) {
        var panel = document.getElementById("relative");
        panel.style.width = (maxX + panelMarginX) + "px";
        panel.style.height = (maxY + panelMarginY) + "px";
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
//function getTitle() {
//    var x = document.getElementById("modal-title").value;
// }
function addCard(enableLog, c) {
    if (c === void 0) { c = null; }
    var cardUI = document.createElement("DIV");
    cardUI.classList.add('drag-and-drop');
    cardUI.classList.add('black-card');
    var title = document.createElement("DIV");
    var description = document.createElement("DIV");
    title.className = 'card-title';
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
            cardUI.style.left = Math.max(0, c.left) + "px";
            cardUI.style.top = Math.max(0, c.top) + "px";
        }
    }
    else {
        cards.push(new Card(numberFromPx(cardUI.style.left), numberFromPx((cardUI.style.top)), "", ""));
        //カードの位置を左・上方向に出ないようClamp
        cardUI.style.left = Math.max(0, mousePosX - cardWidth / 2) + "px";
        cardUI.style.top = Math.max(0, mousePosY - cardHeight / 2) + "px";
        cards[cards.length - 1].left = numberFromPx(cardUI.style.left);
        cards[cards.length - 1].top = numberFromPx(cardUI.style.top);
    }
    cardUIs.push(cardUI);
    refreshDraggable();
    if (enableLog) {
        logAdd("O:CardAdded");
    }
}
var numberFromPx = function (str) { return parseInt(str.replace("px", ""), 10); };
var pxFromNumber = function (num) { return num + "px"; };
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
    for (var i = 0, l = elements.length; i < l; i++) {
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
    var index = cardUIs.indexOf(e);
    if (index >= 0) {
        cardUIs.splice(index, 1);
        document.body.removeChild(e);
        cards.splice(index, 1);
        logAdd("O:CardRemoved");
    }
    else {
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
        var toolTipWidth = toolTipUI.clientWidth;
        var toolTipHeight = toolTipUI.clientHeight;
        var e = event;
        if (e.pageX + toolTipWidth < windowWidth) {
            toolTipUI.style.left = e.pageX + "px";
        }
        else {
            //端から出る場合、カーソルの左側にpopさせる
            toolTipUI.style.left = pxFromNumber(e.pageX - toolTipWidth);
        }
        if (e.pageY + toolTipHeight < windowHeight) {
            toolTipUI.style.top = pxFromNumber(e.pageY);
        }
        else {
            //端から出る場合、カーソルの上側にpopさせる
            toolTipUI.style.top = pxFromNumber(e.pageY);
            toolTipUI.style.top = pxFromNumber(e.pageY + toolTipHeight);
        }
    }
    else {
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
        var e = event;
        posOffsetX = e.pageX - this.offsetLeft;
        posOffsetY = e.pageY - this.offsetTop;
        dragStartX = e.pageX;
        dragStartY = e.pageY;
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
    var e = event;
    if (dragStartX === e.pageX && dragStartY === e.pageY) {
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
    if (hours < 10) {
        logStr += "0";
    }
    logStr += hours + ":";
    if (minutes < 10) {
        logStr += "0";
    }
    logStr += minutes + ":";
    if (seconds < 10) {
        logStr += "0";
    }
    logStr += seconds;
    logStr += "　" + str;
    logStr += "<br>";
    logStrArray.push(logStr);
    var logUI = document.getElementById("log");
    logUI.innerHTML = logStrArray.join("");
}
