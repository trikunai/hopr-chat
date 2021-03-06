import * as root from '../index'
const mod = root.commands

describe('Commands', () => {

  it('can import commands', () => {
    expect(mod).toBeDefined()
  }) 

  it('can construct Commands object', () => {
    let mockNode: any = jest.fn()
    expect(mod.Commands).toBeDefined()
    let cmds = new mod.Commands(mockNode)
    expect(cmds).toBeTruthy()
  })

  it('responds to nonsense commands', async () => {
    let mockNode: any = jest.fn()
    expect(mod.Commands).toBeDefined()
    let cmds = new mod.Commands(mockNode)

    expect(await cmds.execute('not-a-real-command')).toMatch(/unknown command/i)
  })

  it('ping', async () => {
    let mockNode: any = jest.fn()
    mockNode.bootstrapServers = []
    mockNode.ping = jest.fn()
    let mockPeerId = '16Uiu2HAkyXRaL7fKu4qcjaKuo4WXizrpK63Ltd6kG2tH6oSV58AW'

    let cmds = new mod.Commands(mockNode)
    expect(await cmds.execute(`ping  ${mockPeerId}`)).toMatch(/pong/i)
    expect(mockNode.ping).toHaveBeenCalled()
  })


  it('commands can save state', async () => {
    let mockNode: any = jest.fn()
    let cmds = new mod.Commands(mockNode)

    let ir = await cmds.execute('settings includeRecipient')
    expect(ir).toMatch(/false/)
    await cmds.execute('includeRecipient true')
    ir = await cmds.execute('settings includeRecipient')
    expect(ir).toMatch(/true/)
    await cmds.execute('includeRecipient false')
    ir = await cmds.execute('settings includeRecipient')
    expect(ir).toMatch(/false/)
  })

  it('send message', async () => {
    let mockNode: any = jest.fn()
    mockNode.sendMessage = jest.fn()
    let cmds = new mod.Commands(mockNode)
    await cmds.execute('send 16Uiu2HAmAJStiomwq27Kkvtat8KiEHLBSnAkkKCqZmLYKVLtkiB7 Hello, world')
    expect(mockNode.sendMessage).toHaveBeenCalled()
    expect(await cmds.execute('send unknown-alias Hello, world')).toMatch(/invalid/i)
  })

  it('alias addresses', async () => {
    let mockNode: any = jest.fn()
    mockNode.sendMessage = jest.fn()
    let cmds = new mod.Commands(mockNode)

    let aliases = await cmds.execute('settings alias')
    expect(aliases).toEqual('')

    await cmds.execute('alias 16Uiu2HAmQDFS8a4Bj5PGaTqQLME5SZTRNikz9nUPT3G4T6YL9o7V test')

    aliases = await cmds.execute('settings alias')
    expect(aliases).toMatch(/test/)
    await cmds.execute('send test Hello, world')
    expect(mockNode.sendMessage).toHaveBeenCalled()
  })

  it('version', async () => {
    let mockNode: any = jest.fn()
    let cmds = new mod.Commands(mockNode)
    expect(await cmds.execute('version')).toMatch(/hopr-core/)
  })

  it('crawl', async () => {
    let mockNode: any = jest.fn()
    mockNode.network = jest.fn()
    mockNode.network.crawler = jest.fn()
    mockNode.network.crawler.crawl = jest.fn()

    let cmds = new mod.Commands(mockNode)
    expect(await cmds.execute('crawl')).toBeFalsy()
    expect(mockNode.network.crawler.crawl).toHaveBeenCalled()

  })

  it('help', async () => {
    let mockNode: any = jest.fn()
    let cmds = new mod.Commands(mockNode)
    expect(await cmds.execute('help')).toMatch(/help/)
  })

  it('listConnectors', async() => {
    let mockNode: any = jest.fn()
    let cmds = new mod.Commands(mockNode)
    expect(await cmds.execute('listConnectors')).toMatch(/ethereum/)
  })

  it('myAddress', async() => {
    let mockNode: any = jest.fn()
    mockNode.paymentChannels = jest.fn()
    mockNode.paymentChannels.constants = jest.fn()
    mockNode.paymentChannels.utils = jest.fn()
    mockNode.paymentChannels.utils.pubKeyToAccountId = jest.fn(() => "")
    mockNode.paymentChannels.constants.CHAIN_NAME = "2CHAINZ"
    mockNode.peerInfo = jest.fn()
    mockNode.peerInfo.id = jest.fn()
    mockNode.peerInfo.id.toB58String= jest.fn()
    mockNode.peerInfo.id.pubKey = jest.fn()
    mockNode.peerInfo.id.pubKey.marshal = jest.fn()

    let cmds = new mod.Commands(mockNode)
    expect(await cmds.execute('myAddress')).toMatch(/HOPR/)
  })

  it('multisend', async() => {

    let seq = 0
    let mockNode: any = jest.fn()
    mockNode.sendMessage = jest.fn()
    let mockReadline: any = jest.fn()
    mockReadline.write = jest.fn()
    mockReadline.pause = jest.fn()
    mockReadline.resume = jest.fn()

    mockReadline.question = jest.fn((question, resolve) => {
      expect(question).toEqual('send >')
      if (seq == 0){
        resolve('hello')
        seq++
      } else {
        expect(mockNode.sendMessage).toHaveBeenCalled()
        resolve('quit')
      }
    })

    let cmds = new mod.Commands(mockNode, mockReadline)

    await cmds.execute('alias 16Uiu2HAmQDFS8a4Bj5PGaTqQLME5SZTRNikz9nUPT3G4T6YL9o7V test2')
    await cmds.execute('multisend test2')
    expect(mockReadline.question).toHaveBeenCalled()
  })

  it('autocomplete sendmessage', async() => {
    let mockNode: any = jest.fn()
    mockNode.sendMessage = jest.fn()
    mockNode.bootstrapServers = []
    mockNode.network = jest.fn()
    mockNode.network.peerStore = jest.fn()
    mockNode.network.peerStore.peers = [{id: '16Uiu2HAmAJStiomwq27Kkvtat8KiEHLBSnAkkKCqZmLYKVLtkiB7' }]

    let cmds = new mod.Commands(mockNode)
    expect((await cmds.autocomplete('send 16Ui'))[0][0]).toMatch(/send 16U/)
    expect((await cmds.autocomplete('send foo'))[0][0]).toBe('')

    await cmds.execute('alias 16Uiu2HAmQDFS8a4Bj5PGaTqQLME5SZTRNikz9nUPT3G4T6YL9o7V test')

    expect((await cmds.autocomplete('send t'))[0][0]).toBe("send test")
  })
})

