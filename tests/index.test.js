const DraftToTrystup = require('../index')

const ToStyleRange = (offset, length, style) => ({offset, length, style})
const ToBold = (offset, length) => ToStyleRange(offset, length, 'BOLD')
const ToItalic = (offset, length) => ToStyleRange(offset, length, 'ITALIC')
const ToEntityRange = (offset, length, key) => ({offset, length, key})
const ToBlock = text => {
  return {
    text,
    inlineStyleRanges:[],
    entityRanges:[]
  }
}

test('First test',()=> {
  expect(DraftToTrystup({
    blocks: [],
    entityMap: null
  })).toBe('')
})

test('Second test', () => {
  expect(DraftToTrystup({
    entityMap: {'0':{type:'LINK',data:{url:'http://google.com'}}},
    blocks:[{
        text: '--BBEEIEBB--',
        inlineStyleRanges: [
            ToBold(2,8),
            ToItalic(6,1)
        ],
        entityRanges: [            
          ToEntityRange(4,4,0)
        ]
    }]
  })).toBe('--#[b BB#[(http://google.com) EEIE]BB]--')
})

test('Hello world test', () => {
  expect(DraftToTrystup({
    entityMap: {},
    blocks:[ToBlock('Hello world!')]
  })).toBe('Hello world!')
})

test('Two blocks', () => {
  expect(DraftToTrystup({
    entityMap: {},
    blocks:[
      ToBlock('Hello world!'),
      ToBlock('Goodbye cruel world!')
    ]
  })).toBe('Hello world!Goodbye cruel world!')
})