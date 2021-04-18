// ==UserScript==
// @name        DTF Blocking Note
// @match       https://dtf.ru/*
// @version     0.1  (2021-04-18)
// @license     MIT
// @author      KekW - https://dtf.ru/u/182912-kekw
// @description Записная книга для мистеров лохов.
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @run-at      document-end
// ==/UserScript==

let _kekw_dtfBlockList = {};
let userNameBlock = '';
let userIdBlock = -1;

let head = document.head || document.getElementsByTagName('head')[0];
let body = document.body || document.getElementsByTagName('body')[0];

let DocStyle = document.createElement('style');
let cssSelect = `#dataheadBlock { height: 60px; padding: 4px 0px; box-sizing: border-box; display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap; position: relative; left: -40px; }#blockListId { display: block; position: relative; width: 36px; height: 36px; margin: 7px; padding: 8px; box-sizing: border-box; border-radius: 24px; overflow: hidden; font-size: 20px; line-height: 20px; color: var(--primary-color); user-select: none; -ms-user-select: none; -moz-user-select: none; border: none; outline: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }._kekw_notice_block_comm:hover:before {display: block;cursor:pointer;} ._kekw_notice_block_comm:before {background-color: rgba(0, 0, 0, 0.4);color: white;font-weight: bold;border: 3px solid rgb(241, 241, 241);position: absolute;left: 50%;transform: translate(-50%, -50%);z-index: 2;width: auto;padding: 20px;margin-top: 40px;text-align: center;content: attr(data-blacked);display: none;}._kekw_block_this_comment > *{filter: blur(8px);cursor:pointer;}._kekw_notice_block:hover:before{display: block;}._kekw_notice_block:before{background-color: rgba(0, 0, 0, 0.4); color: white; font-weight: bold; border: 3px solid rgb(241, 241, 241); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 80%; padding: 20px; text-align: center; content: attr(data-blacked); display: none;}._kekw_blocked_this_post>*{filter:blur(8px);}#classSelect>div>select{-webkit-appearance:none;-moz-appearance:none;-ms-appearance:none;appearance:none;outline:0;box-shadow:none;border:0!important;background:#2c3e50;background-image:none}#classSelect>div>select::-ms-expand{display:none}#classSelect>.select{position:relative;display:flex;width:20em;height:3em;line-height:3;background:#2c3e50;overflow:hidden;border-radius:.25em;margin-bottom:25px}#classSelect>div>select{flex:1;padding:0 .5em;color:#fff;cursor:pointer}#classSelect>.select::after{content:'\\25BC';position:absolute;top:0;right:0;padding:0 1em;background:#34495e;cursor:pointer;pointer-events:none;-webkit-transition:.25s all ease;-o-transition:.25s all ease;transition:.25s all ease}#classSelect>.select:hover::after{color:#f39c12}`;
head.appendChild(DocStyle);
DocStyle.type = 'text/css';
if (DocStyle.styleSheet){
    DocStyle.styleSheet.cssText = cssSelect;
} else {
    DocStyle.appendChild(document.createTextNode(cssSelect));
}

let popupBlock = `
<div class="popup" id="_kekw_popup_main_block">
	<div class="popup__layout popup__layout--shown"></div>
	<div class="popup__container popup__container--shown">
		<div class="popup__container__window popup__container__window--styled" style="width:500px!important;">
			<div class="popup__container__window__close" id="_kekw_close_dtf_popup_block">
				<svg class="icon icon--ui_close" width="12" height="12">
					<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#ui_close"></use>
				</svg>
			</div>
			<div class="popup__container__window__tpl">
				<div class="popup__content popup__content--misprint">
					<h4>Блокировка <span id="userNameDtfBlock"></span></h4>
					<div>
                        <fieldset id="classSelect">
                            <div class="select">
                                <select name="blockingType" id="blockingType">
                                    <option value="1" selected>Заблокировать полностью</option>
                                    <option value="2">Скрывать полностью</option>
                                    <option value="3">Заблокировать посты</option>
                                    <option value="4">Заблокировать комментарии</option>
                                    <option value="5">Скрывать посты</option>
                                    <option value="6">Скрывать комментарии</option>
                                </select>
                            </div>
                        </fieldset>
                        <fieldset class="ui_form">
                            <textarea name="_kekw_dtf_reason_block" id="_kekw_dtf_reason_block" tabindex="1" placeholder="По какой причине? Во имя чего? (Не обязательно)"></textarea>
                        </fieldset>
						<fieldset style="margin-top: 20px;">
							<input type="submit" class="ui-button ui-button--2" id="_kekw_dtf_block_set_user" value="Заблокировать">
                            <input type="button" class="ui-button ui-button--3" id="_kekw_dtf_block_clear_user" value="Снять блокировку">
						</fieldset>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
`;

let allListBlocked = `
<div class="popup" id="_kekw_popup_list_block">
	<div class="popup__layout popup__layout--shown"></div>
	<div class="popup__container popup__container--shown">
		<div class="popup__container__window popup__container__window--styled" style="width: 1280px!important;">
			<div class="popup__container__window__close _kekw_close_dtf_popup_list">
				<svg class="icon icon--ui_close" width="12" height="12">
					<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#ui_close"></use>
				</svg>
			</div>
			<div class="popup__container__window__tpl" style="overflow: auto;">
				<div class="popup__content popup__content--misprint">
					<h4>Список заблокированных</h4>
					<div>
                        <fieldset id="listedBlockDTFKEKW">

                        </fieldset>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
`;

let zeroBlocked = `<button class="ui-button ui-button--4" style="cursor: default!important;">У вас нет заблокированных</button>`;

let removeComm = `<div class="comments__item__self comments__item__self--major comments__item__self--ignored">
    <div class="comments__item__text">
        <p>Комментарий скрыт</p>
    </div>
</div>`;

let blockListButton = `<div id="dataheadBlock"><div id="blockListId">⊘</div></div>`;

function saveBlocking()
{
    GM_setValue('_dtf_blocking_user', JSON.stringify(_kekw_dtfBlockList, (k, v) => v ? v : void 0));
}

function setBlock()
{
    if (userIdBlock <= 0) {
        return;
    }

    let getTypeOfBlocking = document.getElementById('blockingType').value;
    let getReasonBlock = document.getElementById('_kekw_dtf_reason_block').value;

    Object.assign(_kekw_dtfBlockList, { [userIdBlock]: getTypeOfBlocking + '|$|' + getReasonBlock + '|$|' + userNameBlock});
    saveBlocking();

    document.getElementById('_kekw_popup_main_block').remove();
}

function clearBlock()
{
    delete _kekw_dtfBlockList[userIdBlock];
    saveBlocking();
    document.getElementById('_kekw_popup_main_block').remove();
}

function popupSetBlock()
{
    body.insertAdjacentHTML('beforeend', popupBlock);
    if (_kekw_dtfBlockList[userIdBlock]) {
        let [blockId, reason, name] = _kekw_dtfBlockList[userIdBlock].split('|$|');
        document.getElementById('blockingType').options[blockId-1].selected = 'selected';
        if (reason) {
            document.getElementById('_kekw_dtf_reason_block').value = reason;
        }
    }
    document.getElementById('userNameDtfBlock').innerText = userNameBlock;

    let closePopup = document.getElementById('_kekw_close_dtf_popup_block');
    closePopup.addEventListener('click', function (event) {
        document.getElementById('_kekw_popup_main_block').remove();
    });

    let setBlockButton = document.getElementById('_kekw_dtf_block_set_user');
    setBlockButton.addEventListener('click', setBlock);

    let clearBlockButtom = document.getElementById('_kekw_dtf_block_clear_user');
    clearBlockButtom.addEventListener('click', clearBlock);
}

function addBlockingButton()
{
    let target = document.querySelector('.v-header--with-actions > .v-header__actions');
    let loc = window.location;

    if (target && loc.toString().indexOf('/u/') >= 0 && !document.querySelector('._kekw_dtf_block_user')) {
        userNameBlock = document.querySelector('div.v-header-title__main > a.v-header-title__name').innerText.toString();
        userIdBlock = target.querySelector('[data-subsite-id]').dataset.subsiteId;

        let divButton = document.createElement('div');

        divButton.onclick = popupSetBlock;

        divButton.className = '_kekw_dtf_block_user v-button v-button--default v-button--size-default';
        divButton.innerHTML = `<span class="v-button__label" style="font-size: 22px;margin-bottom: 3px;">⊘</span>`;

        target.insertAdjacentElement('afterbegin', divButton);
    }

    if (!userNameBlock && loc.toString().indexOf('/u/')) {
        setTimeout(addBlockingButton, 500);
    }
}

function muteNews(feedBlock)
{
    if (!feedBlock.classList.contains('content-header-author')) {
        return;
    }

    if (document.querySelectorAll('div[class*="l-entry__header"]').length > 0) {
        return;
    }

    let nameBlocked = feedBlock.parentNode.parentNode.parentNode.parentNode.querySelectorAll('a[href*="/u/"] > div[class="content-header-author__name"]')[0].innerHTML.toString().trim();
    feedBlock.parentNode.parentNode.parentNode.parentNode.setAttribute('data-blacked', 'ЗАБЛОКИРОВАН — ' + nameBlocked.toUpperCase());
    feedBlock.parentNode.parentNode.parentNode.classList.add('_kekw_blocked_this_post');
    feedBlock.parentNode.parentNode.parentNode.parentNode.classList.add('_kekw_notice_block');
}

function muteComm(feedBlock)
{
    if (!feedBlock.classList.contains('comments__item__user')) {
        return;
    }

    let nameBlocked = feedBlock.querySelectorAll('p[class="comments__item__user__name"]')[0].innerText;
    feedBlock.parentNode.parentNode.parentNode.parentNode.setAttribute('data-blacked', 'ЗАБЛОКИРОВАН — ' + nameBlocked.toUpperCase());
    feedBlock.parentNode.parentNode.parentNode.parentNode.classList.add('_kekw_block_this_comment', '_kekw_notice_block_comm');

    feedBlock.parentNode.parentNode.parentNode.parentNode.parentNode.querySelectorAll('div[class*="comments__item__space"]')[0].addEventListener('click', function(e) {
        e.target.classList.remove('_kekw_block_this_comment', '_kekw_notice_block_comm');
        feedBlock.classList.remove('_kekw_has_block');
        feedBlock.classList.add('_kekw_unblock_this_comment');
    });
}

function deleteNews(feedBlock)
{
    if (!feedBlock.classList.contains('content-header-author')) {
        return;
    }

    if (document.querySelectorAll('div[class*="l-entry__header"]').length > 0) {
        return;
    }

    feedBlock.parentNode.parentNode.parentNode.parentNode.remove();
}

function deleteComm(feedBlock)
{
    if (!feedBlock.classList.contains('comments__item__user')) {
        return;
    }

    feedBlock.parentNode.parentNode.parentNode.innerHTML = removeComm;
}

function realizeBlock()
{
    Object.keys(_kekw_dtfBlockList).forEach(function(id) {
        let [idBlock, reason, name] = _kekw_dtfBlockList[id].split('|$|');
        document.querySelectorAll('a[href*="u/' + id + '-"][class*="content-header-author"]:not(._kekw_has_block), a[href*="u/' + id + '-"][class*="comments__item__user"]:not(._kekw_unblock_this_comment):not(._kekw_has_block)').forEach(function(feedBlock) {

            if (idBlock == 1) {
                muteNews(feedBlock);
                muteComm(feedBlock);
                feedBlock.classList.add('_kekw_has_block');
            } else if (idBlock == 2) {
                deleteNews(feedBlock);
                deleteComm(feedBlock);
            } else if (idBlock == 3) {
                muteNews(feedBlock);
                feedBlock.classList.add('_kekw_has_block');
            } else if (idBlock == 4) {
                muteComm(feedBlock);
                feedBlock.classList.add('_kekw_has_block');
            } else if (idBlock == 5) {
                deleteNews(feedBlock);
            } else if (idBlock == 6) {
                deleteComm(feedBlock);
            }
        });
    });
}

function removeBlockedById(id)
{
    delete _kekw_dtfBlockList[id];
    document.getElementById('blockIdDTF-'+id).remove();
    saveBlocking();
}

function addBlockListButton()
{
    if (!document.querySelectorAll('[class="site-header-user"]')[0]) {
        setTimeout(addBlockListButton, 500);
        return;
    }

    document.querySelectorAll('[class="site-header-user"]')[0].insertAdjacentHTML('afterEnd', blockListButton);
    document.getElementById('blockListId').addEventListener('click', function(e) {
        body.insertAdjacentHTML('beforeend', allListBlocked);
        let colorText = '#000';
        if (body.classList.contains('s42-is-dark')) {
            colorText = '#fff';
        }
        if (Object.keys(_kekw_dtfBlockList).length === 0) {
            document.getElementById('listedBlockDTFKEKW').innerHTML = zeroBlocked;
        } else {
            let listDesgn = "<ol style=\"list-style: decimal;padding: 0px 17px;max-height: 620px;\">";
            Object.keys(_kekw_dtfBlockList).forEach(function(id) {
                let [idBlock, reason, name] = _kekw_dtfBlockList[id].split('|$|');
                reason = reason ? ' [ Причина: ' + reason + ' ]' : '';
                listDesgn += "<li id=\"blockIdDTF-"+id+"\" style=\"margin-bottom: 10px;color: "+colorText+"!important;\">" + name + reason + " <span class=\"removeBlockedById\" style=\"cursor:pointer;text-decoration: underline;color: #d91e18;\" data-blockedid=\""+id+"\">[ Разблокировать ]</span></li>";
            });
            listDesgn += "</ol>";
            document.getElementById('listedBlockDTFKEKW').innerHTML = listDesgn;
            document.querySelectorAll('[class=removeBlockedById]').forEach(function(unblock) {
                unblock.addEventListener('click', function (event) {
                    removeBlockedById(unblock.dataset.blockedid);
                    return false;
                });
            });
        }

        document.querySelectorAll('[class*=_kekw_close_dtf_popup_list]')[0].addEventListener('click', function (event) {
            document.getElementById('_kekw_popup_list_block').remove();
        });

    });
}

function init(run)
{
    try {
        _kekw_dtfBlockList = JSON.parse(GM_getValue('_dtf_blocking_user', '{}') || '{}');
    } catch (e) {
        _kekw_dtfBlockList = {};
    }

    if (!run) {
        addBlockListButton();
        addBlockingButton();
    }
}


addEventListener('DOMContentLoaded', function() {
    realizeBlock();
});

addEventListener('DOMNodeInserted', function() {
    realizeBlock();
});

init(false);
GM_addValueChangeListener('_dtf_blocking_user', function(changes, namespace) {
    init(true);
});