const _ = require('lodash')

const CODES = {
  BOLD:'b',   ITALIC:'i',   UNDERLINE:'u', STRIKEOUT:'s',
  BG0: 'bg0', BG1:   'bg1', BG2: 'bg2', BG3:'bg3', BG4:'bg4', BG5:'bg5',
  FG0: 'fg0', FG2:   'fg2', FG3: 'fg3', FG4:'fg4', FG5:'fg5', 
  F0:  'f0',  F1:    'f1',  F2:  'f2',
  S1:  's1',  S2:    's2',  S3:  's3',  S4:'s4', S5:'s5'
}

const isContinue = (lastOne, segment) => {
  if(!lastOne) return false
  if(segment.entityKey !== lastOne.entityKey) return false
  return _.isEqual(segment.formats, lastOne.formats)
}
const ToText = ch => {
  switch(ch) {
    case ']': return '\\]'
    case '\\': return '\\\\'
    case '[': return '\\['
    default: return ch
  }
}
const buildSegments = block => {
  const {text, inlineStyleRanges, entityRanges} = block
  const chars = text.split('').map(LETTER => ({text:ToText(LETTER),formats:[], entityKey:null}))
  inlineStyleRanges.forEach(isr => {
    const {offset, length, style} = isr
    for(let i = 0; i<length; i++) chars[offset+i].formats.push(style)
  })
  entityRanges.forEach(er => {
    const {offset, length, key} = er
    for(let i = 0; i < length; i++) chars[offset+i].entityKey = key
  })
  return chars
}
const mergeSegments = (segments, segment) => {
  if(isContinue(_.last(segments), segment)) _.last(segments).text += segment.text
  else segments.push(segment)
  return segments
}
const trystalize = (entityMap, accum, segment, i, arr) => {
  const {formats, entityKey} = segment
  let {text} = segment
  const inEntity = _.isInteger(accum.entityKey) && accum.entityKey === entityKey
  if(inEntity) accum.trystup += text
  else {
    const tagsToOpen = _.difference(formats, accum.formats).map(format => CODES[format] + ' ')
    let tagsToClose = _.difference(accum.formats, formats).length
    if(entityKey !== accum.entityKey) {
      if(_.isInteger(accum.entityKey)) tagsToClose++
      if(_.isInteger(entityKey)) {
        const entity = entityMap[entityKey.toString()]
        switch(entity.type) {
          case 'LINK': tagsToOpen.push(`(${entity.data.url}) `); break
          case 'FIELD': 
            tagsToOpen.push(`=${entity.data.formula}`)
            text = ''
            break
        }
      }
    }
    const trystup = ']'.repeat(tagsToClose) + tagsToOpen.reduceRight((accum,tag)=>`#[${tag}${accum}`,text)
    accum = {formats, entityKey, trystup: accum.trystup + trystup}
  }
  const allDone = i === (arr.length - 1) 
  if(allDone) {
    let openTagCount = accum.formats.length
    if(_.isInteger(accum.entityKey)) openTagCount++
    accum.trystup += ']'.repeat(openTagCount)
  }
  return accum
}
const processBlock = (block,entityMap) =>  
  buildSegments(block)
  .reduce(mergeSegments,[])
  .reduce(trystalize.bind(null, entityMap),{formats:[], entityKey:null,trystup:''})
  .trystup

  const draftToTrystup = ({blocks, entityMap}) =>
    blocks
    .reduce((trystup, block)=>trystup + processBlock(block, entityMap),'')

module.exports = draftToTrystup


// const JSDRAFT = {
//     entityMap: {'0':{type:'LINK',data:{url:'http://google.com'}}},
//     blocks:[{
//         text: '--BBEEIEBB--',   // AA<b>BB<link>CC</link>BBBB<b>AA
//         inlineStyleRanges: [
//             {offset:2, length:8, style:'BOLD'},
//             {offset:6, length:1, style:'ITALIC'}
//         ],
//         entityRanges: [
//             {offset:4, length:4, key:0}
//         ]
//     }]
// }
