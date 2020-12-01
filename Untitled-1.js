//要素内のクリックされた位置を取得するグローバル（のような）変数
let posOffsetX;
let posOffsetY;
let drag = null;
let cards = [];
let cardUIs = [];
const cardWidth = 150;
const cardHeight = 80;
let isEditMode = false;
let mousePosX = 0;
let mousePosY = 0;
let currentEditing;
let modal;
let modalDescription;
let currentHover;
let isInputLocked = false;
let dragStartX;
let dragStartY;
let lastMovementX = 0;
let lastMovementY = 0;
let toolTipUI;
const panelMarginX = 750;
const panelMarginY = 1000;
let windowWidth;
let windowHeight;
let logStrArray = [];
let disableToolTip = false;
const arrowWidth = 7;
const arrowLength = 18;
const toolTipLeftPopOffset = 25;
const toolTipRightPopOffset = 5;
const toolTipBottomPopOffset = 10;
let deletedCards = [];
let resizing = null;
let modalRestore;
class Action {
    //記録用
    //移動、消去、追加、線追加、線消去、タイプ変更、テキスト編集
}
const action = (a) => {
    //記録用action関数
    //history.push(a)
}
const reversedAction = (a) => {
    //actionの反転用関数
    //return reversed;
}
const restoreCard = (i) => {
    let restore = deletedCards[i];
    restore.left = Math.max(0, mousePosX - (cardWidth / 2));
    restore.top = Math.max(0, mousePosY - (cardHeight / 2));
    cards.push(restore);
    deletedCards.splice(i, 1);
    logAdd("title=" + cards[cards.length - 1].title);
    reloadCards();
}


const openRestoreModal = () => {
    modalRestore.style.display = block;
}
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

//ZCV
//X delete
//E edit
//Y split
//S scale
//G grab

//free key
//12345
//Q
//W
//R
//T タイプ変更パイ、+キー
//A
//D
//F
//B
//left right
//ESC
//BS
//TAB EditMode?
//Space scroll?
//ctrl
//alt

//B:Branch
//C:PC,Character,Person
//C:NPC
//I:Information,Clue
//T:Item,Thing
//S:Scenario
//M:Memo(forKP)
//P:Idea,Plan(forKP)
//P:Place
//T:TimeLine

const resizeCard = (cardUI, cursorPos) => {
    const card = cards[cardUIs.indexOf(cardUI)];
    const width = cursorPos.x - card.left + window.scrollX;
    const height = cursorPos.y - card.top + window.scrollY;
    card.width = width;
    card.height = height;
    //logAdd(width + "");
    cardUI.style.width = pxFromNumber(width);
    cardUI.style.height = pxFromNumber(height);
    const area = width * height;
    cardUI.style.zIndex = 1000000000 - area + "";
    //あとで開始位置からのoffset処理かく
    refreshCanvas();
}


const cardWidthFromIndex = (index) => {
    return numberFromPx(cardUI[index].style.clientWidth);
}
const cardHeightFromIndex = (index) => {
    return numberFromPx(cardUI[index].style.clientHeight);
}
let connectingStartCard = new Vector2(-1, -1);
let connectingEnd = new Vector2(-1, -1);
let connecting = false;
var TestClass;
const scenarioName = "寝台特急プレアデスの悪夢";
const canvas = document.getElementById('canvas');

const addFunction = () => {
    refreshCanvas();
}

const removeLines = (card) => {
    index = cardUIs.indexOf(card);
    for (let i = 0, l = lines.length; i < l; i++) {
        console.log(i + ":" + lines[i]);
        if (lines[i].startIndex === index || lines[i].endIndex === index) {
            lines.splice(i, 1);
            i -= 1;
            l -= 1;
        }
    }
    refreshCanvas();
}

class Card {
    constructor(left, top, title, description, type = 0, width = 0, height = 0, tag = 0) {
        this.left = left;
        this.top = top;
        this.title = title;
        this.description = description;
        this.type = type;
        this.width = width;
        this.height = height;
        this.tag = tag;
    }
}
class Line {
    constructor(startIndex, endIndex) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }
}
let lines = [];

const removeCardFromList = (index) => {
    cards.splice(index, 1);
    //let spliceIndexArray=[]
    console.log(lines.length + "len");
    for (let i = 0, l = lines.length; i < l; i++) {
        console.log(i + ":" + lines[i]);
        if (lines[i].startIndex === index || lines[i].endIndex === index) {
            lines.splice(i, 1);
            i -= 1;
            l -= 1;
        } else {
            if (lines[i].startIndex > index) {
                lines[i].startIndex -= 1;
            }
            if (lines[i].endIndex > index) {
                lines[i].endIndex -= 1;
            }
        }
    }
    refreshCanvas();
}

const addLine = (startIndex, endIndex) => {
    const some = lines.some(
        l => l.startIndex === startIndex && l.endIndex === endIndex);
    if (some) {
        logAdd("O:重複する線の追加を取り消しました")
    } else {
        lines.push(new Line(startIndex, endIndex));
    }
    refreshCanvas();

}

const drawConnectingCheck = () => {
    refreshCanvas();
    if (connectingStartCard && connectingEnd.x >= 0) {
        startPoint = new Vector2(numberFromPx(connectingStartCard.style.left), numberFromPx(connectingStartCard.style.top))
        if (currentHover) {
            drawConnectingFromPosition(startPoint, connectingEnd, sizeVectorFromIndex(cardUIs.indexOf(connectingStartCard)), sizeVectorFromIndex(cardUIs.indexOf(currentHover)), false);
        } else {
            drawConnectingFromPosition(startPoint, connectingEnd, sizeVectorFromIndex(cardUIs.indexOf(connectingStartCard)), new Vector2(1, 1), true);
        }
    }
}

const drawConnectingFromPosition = (startPosition, endPosition, startSizeVector, endSizeVector, isEndFree = false) => {
    const cardSlope = startSizeVector.y / startSizeVector.x;
    //logAdd(cardSlope + "=" + startSizeVector.y + "/" + startSizeVector.x);
    let offset = new Vector2(0, 0);
    let cardSizeOffsetStart = new Vector2(startSizeVector.x / 2, startSizeVector.y / 2);
    let cardSizeOffsetEnd = new Vector2(endSizeVector.x / 2, endSizeVector.y / 2);
    const isXPositive = (endPosition.x - startPosition.x) >= 0;
    const slope = (endPosition.y - startPosition.y) / (endPosition.x - startPosition.x);
    //y軸が通常と反転しているが、コメントの象限表記は通常のもの
    let slopeMultiplier = 1;
    if (slope > 0) {
        //第2・4象限
        if (isXPositive) {
            //第2象限
            offset = new Vector2(1, 1);
        } else {
            //第4象限
            offset = new Vector2(-1, -1);
        }
    } else {
        slopeMultiplier = -1;
        if (isXPositive) {
            //1st
            offset = new Vector2(-1, -1);
        } else {
            //3rd
            offset = new Vector2(1, 1);
        }
    }
    if (slope * slopeMultiplier > cardSlope) {
        //fixed y
        offset.x *= startSizeVector.y / 2 / slope;
        offset.y *= startSizeVector.y / 2;
    } else {
        //fixed x
        offset.x *= slopeMultiplier * startSizeVector.x / 2;
        offset.y *= slopeMultiplier * startSizeVector.x / 2 * slope;
    }

    const startPoint = new Vector2(startPosition.x + cardSizeOffsetStart.x + offset.x, startPosition.y + cardSizeOffsetStart.y + offset.y);
    let endPoint;
    if (isEndFree) {
        endPoint = endPosition
    } else {
        offset.x *= cardSizeOffsetEnd.x / cardSizeOffsetStart.x;
        offset.y *= cardSizeOffsetEnd.y / cardSizeOffsetStart.y;
        endPoint = new Vector2(endPosition.x + cardSizeOffsetEnd.x - offset.x, endPosition.y + cardSizeOffsetEnd.y - offset.y);
    }
    drawLine(startPoint, endPoint);
}

const drawConnectionFromIndex = (startIndex, endIndex) => {
    const startCardPos = new Vector2(cards[startIndex].left, cards[startIndex].top);
    const endCardPos = new Vector2(cards[endIndex].left, cards[endIndex].top);
    drawConnectingFromPosition(startCardPos, endCardPos, sizeVectorFromIndex(startIndex), sizeVectorFromIndex(endIndex));

}
const sizeVectorFromIndex = (index) => {
    return new Vector2(cardUIs[index].offsetWidth, cardUIs[index].offsetHeight);
}
const startConnecting = () => {
    connecting = true;
    startCard = cards[cardUIs.indexOf(currentHover)];
    connectingStartCard = currentHover;
    connectingEnd = new Vector2(mousePosX + window.scrollX, mousePosY + window.scrollY);
    toolTipUI.style.display = "none";
    document.documentElement.style.cursor = "crosshair";
}

const endConnecting = () => {
    connecting = false;
    addLine(cardUIs.indexOf(connectingStartCard), cardUIs.indexOf(currentHover));
    connectingStartCard = false;
    connectingEnd = new Vector2(-1, -1);
    refreshCanvas();
    document.documentElement.style.cursor = "default";
}

const abortConnecting = () => {
    connecting = false;
    connectingStartCard = false;
    connectingEnd = new Vector2(-1, -1);
    refreshCanvas();
    document.documentElement.style.cursor = "default";
}

//const resizeCanvas = (width, height) => {}
const drawLines = () => {
    for (let i = 0, l = lines.length; i < l; i++) {
        // const start = cards[lines[i].startIndex];
        // const end = cards[lines[i].endIndex];
        //if (start && end) {
        drawConnectionFromIndex(lines[i].startIndex, lines[i].endIndex);
        //            drawLine(new Vector2(start.left + (cardWidth / 2), start.top + (cardHeight / 2)), new Vector2(end.left + (cardWidth / 2), end.top + (cardHeight / 2)));
        //}
    }
}
const drawLine = (start, end) => {
    const vctr = new Vector(end.x - start.x, end.y - start.y);

    if (Vector.len(vctr) != 0 && Vector.len(vctr)) {
        const normalizedVector = Vector.normalize(vctr);
        const endPointVctr = new Vector(end.x, end.y);
        if (canvas.getContext) {
            //
            var context = canvas.getContext('2d');
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = "rgb(255,255,255)";
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.closePath();
            context.stroke();
            //矢印部描写
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = "rgb(255,255,255)";
            context.moveTo(end.x, end.y);
            arrowOffsetR = Vector.mul(new Vector(normalizedVector.y, -normalizedVector.x), arrowWidth)
            arrowOffsetR2 = Vector.mul(normalizedVector, -arrowLength);
            arrowEndR = Vector.add(Vector.add(endPointVctr, arrowOffsetR), arrowOffsetR2);
            context.lineTo(arrowEndR.x, arrowEndR.y);
            context.closePath();
            context.stroke();
        }
    }
}
onStart();
function saveToNCMB() {
    TestClass.equalTo("scenarioName", scenarioName)
        .order("createDate", true)
        .fetchAll()
        .then(function (results) {
            logAdd("O:NCMBからシナリオを取得");
            var object = results[0];
            object.set("cards", JsonFromCards())
                .set("lines", JsonFromLines())
                .update()
                .then(function (object) {
                    logAdd("O:NCMBのデータを更新しました");
                });
        })
        .catch(function (err) {
            logAdd("E:NCMBのデータ更新に失敗しました");
            var newObject = new TestClass();
            newObject.set("scenarioName", scenarioName)
                .set("cards", JsonFromCards())
                .save()
                .then(function (newObject) {
                    logAdd("O:NCMBにシナリオを新規保存");
                })
                .catch(function (err) {
                    logAdd("E:NCMBへの新規保存に失敗しました");
                });
        });
}
function loadFromNCMB() {
    document.documentElement.style.cursor = "wait";
    TestClass.equalTo("scenarioName", scenarioName)
        .order("createDate", true)
        .fetchAll()
        .then(function (results) {
            logAdd("O:NCMBからシナリオを取得");
            var object = results[0];
            readFromString(object.cards, object.lines);
            refreshCanvas();
            document.documentElement.style.cursor = "default";
        })
        .catch(function (err) {
            logAdd("E:NCMBからシナリオの取得に失敗しました");
            logAdd("E:" + err);
            document.documentElement.style.cursor = "default";
        });
}

function onStart() {
    //logAdd(document.elementFromPoint( event.clientX,event.clientY).);
    //UI要素の検索
    modal = document.getElementById("modal-overlay");
    //modalTitle = document.getElementById("modal-title");
    //modalDescription = document.getElementById("modal-description");
    toolTipUI = document.getElementById("tool-tip");
    refreshDraggable();
    var ncmb = new NCMB("d3a5264ba3539f638997cf8d8bb38e4a12d0bb45284acc309fcf57c94819ea87", "e21485631b01f398f7c322575b6ae2907e2df1248c1bde1305b45f62503842d9");
    TestClass = ncmb.DataStore("TestClass");
    loadFromNCMB();
    document.onkeyup = function (keyEvent) {
        var e = keyEvent;
        if (e.key === '.') {
            isInputLocked = false;
        }
        if (e.key === 'o') {
            resizing = null;
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
                if (e.key === 'o') {
                    if (resizing == null) {
                        resizing = currentHover;
                    }
                }
                if (e.key === '.') {
                    e.preventDefault();
                    isInputLocked = true;
                    edit(currentHover);
                }
                if (e.key === 'f') {
                    removeLines(currentHover);
                }
                if (e.key === 'q') {
                    removeCard(currentHover);
                }
                if (e.key === 'x' || e.altKey) {
                    openRestoreModal();
                }
                if (e.key === 'j' || e.key === 'J') {
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
                    if (e.altKey) {
                        outputTextFile();
                    }
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
            } else {
                if (currentHover) {
                    startConnecting();
                }
            }
        }
    };

    document.onmouseup = function (e) {
        if (e.button == 2) {
            e.preventDefault();
            if (connecting) {
                if (currentHover) {
                    endConnecting();
                } else {
                    abortConnecting();
                }
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
        if (connecting) {
            if (currentHover) {
                endCard = cards[cardUIs.indexOf(currentHover)];
                connectingEnd = new Vector2(endCard.left, endCard.top);
            } else {
                connectingEnd = new Vector2(mousePosX + window.scrollX, mousePosY + window.scrollY);
            }
            drawConnectingCheck();
        }
        if (resizing != null) {
            resizeCard(resizing, new Vector2(mousePosX, mousePosY));
        }
        if (drag != null) {
            drag.style.left = pxFromNumber(omsEvent2.clientX - posOffsetX + scrollPosX);
            drag.style.top = pxFromNumber(omsEvent2.clientY - posOffsetY + scrollPosY);
            var index = cardUIs.indexOf(drag);
            cards[index].top = numberFromPx(drag.style.top);
            cards[index].left = numberFromPx(drag.style.left);
            refreshCanvas();
        }
    };

    //ペーストを使ったデータの保存
    document.addEventListener('paste', function (e) {
        if (!isEditMode) {
            if (e.shiftKey) {
                if (currentHover) {
                    e.preventDefault();
                    pasteAll(e.clipboardData.getData('text'));
                    logAdd("カード情報を反映");
                } else {
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
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
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
function readFromString(cardsStr, linesStr) {
    cards = JSON.parse(cardsStr);
    if (linesStr) {
        lines = JSON.parse(linesStr);
    }
    cancelEdit();
}
function JsonFromCards() {
    var jsonString = JSON.stringify(cards);
    return (jsonString);
}
function JsonFromLines() {
    var jsonString = JSON.stringify(lines);
    return (jsonString);
}

function outputTextFile() {
    var blob = new Blob([JsonFromCards()], { type: "text/plan" });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '寝台特急プレアデスの悪夢.text';
    link.click();
}

function saveCardChange(index, title, description, type, width, height) {
    if (title != null) {
        cards[index].title = title;
    }
    if (description != null) {
        cards[index].description = description;
    }
}
//最も端にあるカードの位置を元にrelativeDivを拡大
function refreshCanvas() {
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
        panel.style.width = pxFromNumber(maxX + panelMarginX);
        panel.style.height = pxFromNumber(maxY + panelMarginY);
        canvas.width = maxX + panelMarginX;
        canvas.height = maxY + panelMarginY;
    }
    drawLines();
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
    var cardUI = document.createElement("DIV");
    cardUI.classList.add('drag-and-drop');
    cardUI.classList.add('memo-card');
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
            cardUI.style.left = pxFromNumber(Math.max(0, c.left));
            cardUI.style.top = pxFromNumber(Math.max(0, c.top));
        }
        if (c.type) {
            cardUI.classList.remove('memo-card');
            switch (c.type) {
                case 0:
                    cardUI.classList.add('memo-card');
                    break;
                case 1:
                    cardUI.classList.add('scenario-card');
                    break;
                case 2:
                    cardUI.classList.add('character-card');
                    break;
                case 3:
                    cardUI.classList.add('item-card');
                    break;
            }
        }
        if (c.width != 0 && c.height != 0) {
            cardUI.style.width = pxFromNumber(c.width);
            cardUI.style.height = pxFromNumber(c.height);
        }
    } else {
        cards.push(new Card(numberFromPx(cardUI.style.left), numberFromPx((cardUI.style.top)), "", ""));
        //カードの位置を左・上方向に出ないようClamp
        cardUI.style.left = pxFromNumber(Math.max(0, window.scrollX + mousePosX - (cardWidth / 2)));
        cardUI.style.top = pxFromNumber(Math.max(0, window.scrollY + mousePosY - (cardHeight / 2)));
        cards[cards.length - 1].left = numberFromPx(cardUI.style.left);
        cards[cards.length - 1].top = numberFromPx(cardUI.style.top);
    }

    if (cardUI.style.width && cardUI.style.height) {
        const area = numberFromPx(cardUI.style.width) * numberFromPx(cardUI.style.height);
        cardUI.style.zIndex = 1000000000 - area + "";
    } else {
        const area = cardWidth * cardHeight;
        cardUI.style.zIndex = 1000000000 - area + "";
    }
    cardUIs.push(cardUI);
    refreshDraggable();
    if (enableLog) {
        logAdd("O:CardAdded");
    }
}
var numberFromPx = function (str) {
    return parseInt(str.replace("px", ""), 10);
};

var pxFromNumber = function (num) {
    return (String(num) + "px");
};
function reloadCards() {
    for (var i = 0; i < cardUIs.length; i++) {
        document.body.removeChild(cardUIs[i]);
    }
    cardUIs = [];
    for (var i = 0; i < cards.length; i++) {
        addCard(false, cards[i]);
    }
    //refreshCanvas();
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
}
//カード編集関係
function edit(editing) {
    const oldModalContent = document.getElementById('modal-content');
    if (oldModalContent) {
        modal.removeChild(oldModalContent);
    }
    currentEditing = editing;
    isEditMode = true;
    modal.style.display = "block";
    let modalContent = document.createElement("DIV");
    let modalTitle = document.createElement("INPUT");
    let modalDescription = document.createElement("TEXTAREA");
    modalContent.id = 'modal-content'
    modalTitle.id = 'modal-title';
    modalDescription.id = 'modal-description';
    modal.appendChild(modalContent);
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalDescription);

    modalTitle.value = currentEditing.children[0].innerHTML;
    modalDescription.value = currentEditing.children[1].innerHTML;
    modalTitle.focus();
    modalTitle.addEventListener('keydown', function () {
        if (isInputLocked) {
            event.preventDefault();
        }
    });
}
const closeEdit = () => {
    isEditMode = false;
    modal.style.display = "none";

    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        modal.removeChild(modalContent);
    }
    reloadCards();
}
function confirmEdit() {
    var index = cardUIs.indexOf(currentEditing);
    cards[index].title = document.getElementById('modal-title').value
    cards[index].description = document.getElementById('modal-description').value;
    //currentEditing.children[0].innerHTML = modalTitle.value;
    //currentEditing.children[1].innerHTML = modalDescription.value;
    closeEdit();
}
function cancelEdit() {
    closeEdit();
}
function removeCard(e) {
    toolTipUI.style.display = "none";
    var index = cardUIs.indexOf(e);
    if (index >= 0) {
        cardUIs.splice(index, 1);
        document.body.removeChild(e);
        removeCardFromList(index);
        logAdd("O:CardRemoved");
    }
    else {
        logAdd("E:削除対象のカードがcardUIsに存在しない");
    }
    currentHover = null;
    refreshCanvas();
}
function menter(e) {
    currentHover = this;
    this.addEventListener("mousemove", toolTipUpdate, false);
    document.addEventListener("keydown", changeCardType);
}

let changeCardType = (e) => {
    if (e.key == 'y') {
        const card = cards[cardUIs.indexOf(currentHover)];
        if (!card.type) {
            card.type = 0;
        }
        card.type++;
        if (card.type > 3) {
            card.type = 0;
        }
        card.width = 0;
        card.height = 0;
        reloadCards();
        refreshCanvas();
    }
}

function toolTipUpdate() {
    if (drag == null && !connecting) {
        currentHover.style.cursor = "grab";
        //windowSizeを更新
        windowWidth = document.documentElement.clientWidth;
        windowHeight = document.documentElement.clientHeight;
        if (isEditMode) {
            windowWidth /= 2;
            toolTipUI.style.width = '24%';
        } else {
            toolTipUI.style.width = '48%';
        }
        //toolTipUIを表示
        toolTipUI.style.display = "block";
        //html内の改行のため、文字列操作
        var str = cards[cardUIs.indexOf(currentHover)].description;
        if (str == "") {
            str = "--本文無し--";
        }
        //一応タグを使えないように置き換える
        str = str.split("<").join("&lt;");
        str = str.split(">").join("&gt;");
        //改行を改行タグに置き換える
        str = str.split("\n").join("<br>");
        toolTipUI.innerHTML = str;
        var toolTipWidth = toolTipUI.clientWidth;
        var toolTipHeight = toolTipUI.clientHeight;
        var e = event;
        if (mousePosX + toolTipWidth < windowWidth) {
            toolTipUI.style.left = pxFromNumber(mousePosX + toolTipRightPopOffset + window.scrollX);
        } else {
            //端から出る場合、カーソルの左側にpopさせる
            toolTipUI.style.left = pxFromNumber(mousePosX - toolTipWidth - toolTipLeftPopOffset + window.scrollX);
        }

        const scrollTop = document.documentElement.scrollTop;
        if (mousePosY + toolTipHeight < windowHeight + scrollTop) {
            toolTipUI.style.top = pxFromNumber(mousePosY + scrollTop);
        } else {
            //端から出る場合、上向きに表示
            // let top = e.pageY - toolTipHeight;
            // if (top < scrollTop) {
            //     top = scrollTop;
            // }
            //toolTipUI.style.top = pxFromNumber(top);

            //端から出る場合、下側をclamp
            let clampedTop = windowHeight + scrollTop - toolTipHeight - toolTipBottomPopOffset;
            //上側がはみ出ない事を優先
            if (clampedTop - scrollTop < 0) {
                clampedTop = scrollTop;
            }
            toolTipUI.style.top = pxFromNumber(clampedTop);
        }
    } else {
        if (drag != null) {
            currentHover.style.cursor = "grabbing";
        }
        toolTipUI.style.display = "none";
    }
}

function mleave(e) {
    currentHover = null;
    this.removeEventListener("mousemove", toolTipUpdate);
    document.removeEventListener("keydown", changeCardType);
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
    currentHover.style.cursor = "grab";
    refreshCanvas();

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
