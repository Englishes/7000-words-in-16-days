'use strict'

const dict = new Map(dictText.split('\n').map(line => line.split(/\t(.+)/)))
  , selInfo = {
    dataNode: document.createElement('dummy'),
    dataNode_prevOne: document.createElement('dummy'),
    set_dataNode_prevOne: node => {
      selInfo.dataNode_prevOne_was = selInfo.dataNode_prevOne
      selInfo.dataNode_prevOne = node || selInfo.dataNode_query() || selInfo.dataNode_prevOne
    },
    dataNode_query: (match = 'exactly') => selInfo.parentNode.querySelector(
      `[${match === 'exactly' ? strTemp.textIs() : strTemp.offset()}]`
    ),
    checkRefocusCount: () => {
      if (selInfo.dataNode_prevOne_was === selInfo.dataNode_prevOne) {
        selInfo.dataNode_prevOne.dataset.refocusCount
          ? selInfo.dataNode_prevOne.dataset.refocusCount++
          : selInfo.dataNode_prevOne.dataset.refocusCount = 1
      }
      if (selInfo.dataNode_prevOne.dataset.refocusCount > 2) selInfo.dataNode_prevOne.remove()
    },
    parentNode: null,
    text: '',
    text_clicked: '',
    text_raw: '',
    text_bodyIsEn: () => /[\w\s]+/.test(selInfo.text),
    text_update: () => selInfo.text = selInfo._.toString().trim().toLowerCase().replace(/\W+$/, ''),
    focusNone: () => selInfo.dataNode_prevOne.classList.remove('focus')
  }
  , strTemp = {
    textIs: () => `data-text='${selInfo.text.replace(/\n/g, '\\n').replace(/[[\]"']/g, `\\$1`)}'`,
    offset: () => `data-text-anchor-offset='${selInfo._.anchorOffset}'`,
    display: (def, phonetic) => `${selInfo.text}&emsp;${phonetic ? `[${phonetic}]` : ''}&emsp;${def}`
  }
  , isRanging = () => selInfo._.type === 'Range'


document.addEventListener('click', e => {
  if (e.target.nodeName !== 'P') {
    if (selInfo._.type !== 'Range') selInfo.focusNone()
    return
  }
  if (selInfo.text_raw) return delete selInfo.text_raw

  selInfo.text = getSelText().toLowerCase()
  if (!selInfo.text) return

  selInfo.parentNode = e.target
  dataTextNode_update({ from: 'click' })
})

document.addEventListener('selectionchange', () => {
  selInfo._ = document.getSelection()
  if (selInfo._.type !== 'Range' || selInfo._.anchorNode !== selInfo._.focusNode) return
  if (selInfo._.anchorNode.parentNode.dataset.text) {
    const beforeIsFocus = selInfo._.anchorNode.parentNode.classList.contains('focus')
    selInfo.focusNone()
    beforeIsFocus && selInfo._.anchorNode.parentNode.classList.add('focus')
    selInfo.set_dataNode_prevOne(selInfo._.anchorNode.parentNode)
    return
  }
  getSelText()
  dataTextNode_update()
  selInfo.checkRefocusCount()
})


function getSelText() {
  selInfo._ = document.getSelection()
  selInfo.parentNode = selInfo._.anchorNode.parentNode
  if (selInfo._.type !== 'Caret') {
    if (isRanging()) selInfo.text_raw = selInfo._.toString()
    return selInfo.text_update()
  }
  selInfo._.modify('move', 'forward', 'word')
  selInfo._.modify('extend', 'backward', 'word')
  selInfo.text_update()
  selInfo._.modify('move', 'forward', 'word')
  return selInfo.text
}

function dataTextNode_update({ from = 'select' } = {}) {
  if (selInfo.text_bodyIsEn() && selInfo.text.length <= 1) return

  selInfo.dataNode = selInfo.dataNode_query()
  if (selInfo.dataNode !== selInfo.dataNode_prevOne) selInfo.focusNone()

  if (selInfo.dataNode) {
    selInfo.dataNode.classList.contains('focus')
      ? (!isRanging() || selInfo.text_raw === selInfo.text)
      && selInfo.dataNode.removeAttribute('class')
      : selInfo.dataNode.classList.contains('select')
        ? selInfo.dataNode.classList.add('focus')
        : selInfo.dataNode.remove()
  }
  else {
    if (from === 'click' && selInfo.text !== selInfo.text_clicked)
      return void (selInfo.text_clicked = selInfo.text)

    if (!dict.get(selInfo.text)) return

    const [def, phonetic] = dict.get(selInfo.text).split('\t')
    selInfo.dataNode = selInfo.dataNode_query('')

    if (selInfo.dataNode) {
      selInfo.dataNode.dataset.text = selInfo.text
      selInfo.dataNode.innerHTML = strTemp.display(def, phonetic)
      selInfo.dataNode.classList.add('select', 'focus')
    } else {
      selInfo.parentNode.closest('p').insertAdjacentHTML('beforeend',
        `<span class='select focus' ` + strTemp.offset() +
        ` data-text='${selInfo.text}'>` + strTemp.display(def, phonetic) +
        `</span>`
      )
    }
  }
  selInfo.set_dataNode_prevOne()
}


function fragmentFromString(strHTML) {
  return Object.assign(document.createElement('template'), { innerHTML: strHTML }).content
}






addEventListener('load', () => {
  let pid = localStorage.getItem('#')
  if (!pid) return
  pid = document.getElementById(pid)
  pid.scrollIntoView()
  history.replaceState(undefined, '', '')
})
let time = Date.now()
addEventListener('scroll', () => {
  if (Date.now() - time < 200) return
  pid = getLastPID()
  if (!pid) return
  localStorage.setItem('#', pid)
})
addEventListener('beforeunload', () => pid && history.replaceState(undefined, '', `#${pid}`))

let pid
function getLastPID() {
  let p = document.caretPositionFromPoint(0, 0).offsetNode.parentNode.closest('p')
  if (!p) return
  p = p.nextElementSibling
  while (p = p.previousElementSibling) if (p.id) return p.id
}