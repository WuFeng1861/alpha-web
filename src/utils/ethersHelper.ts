import {BaseContract, ethers, verifyMessage} from 'ethers';

const defaultsABI: Array<any> = [
  // Some details about the token
  // 代币信息
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  "function decimals() view returns (uint8)",
  
  // Get the account balance
  // 获取指定账户地址的代币余额
  'function balanceOf(address) view returns (uint)',
  
  // Send some of your tokens to someone else
  // 发送指定数量的代币到指定地址
  'function transfer(address to, uint amount)',
  
  // 向某个账户地址指定可用代币额度
  'function approve(address spender, unit amount) nonpayable returns (bool)',
  
  // An event triggered whenever anyone transfers to someone else
  // 该合约的代币发生转账时会触发的事件
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

const UABI: Array<any> = [
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "_decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "_name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "_symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "burn",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default class EthWallet {
  static walletList: EthWallet[] = [];
  userAddress: string | undefined;
  signer: any;
  provider: any;
  walletError: string = "";
  providerUrl: string | undefined;
  ABI: Array<any> = JSON.parse(JSON.stringify(defaultsABI));
  tokenContract: any;
  
  // Optimism chain Mainnet
  static OPTIMISM = {
    chainId: 10,
    chainName: 'OP Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  };
  // Arbitrum chain
  static ARBITRUM = {
    chainId: 42161,
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://arb-mainnet.g.alchemy.com/v2/your-api-key'],
    blockExplorerUrls: ['https://arbiscan.io/'],
  };
  // Binance
  static BINANCE = {
    chainId: 56,
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'Binance Chain Native Token',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/'],
  };
  
  // 断开连接
  disconnect() {
    this.provider = undefined;
    this.signer = undefined;
    this.userAddress = undefined;
    this.walletError = "";
    this.providerUrl = undefined;
    this.ABI = JSON.parse(JSON.stringify(defaultsABI));
    this.tokenContract = undefined;
  }
  
  // 判断地址是否正确
  isAddress(address: string) : boolean {
    return ethers.isAddress(address);
  }
  
  // 初始化provider和signer
  async initProviderAndSigner(url?: string) : Promise<{status: boolean, message: string, data: any}> {
    try {
      // v6
      if (url) {
        this.provider = new ethers.JsonRpcProvider(url)
      } else {
        this.provider = new ethers.BrowserProvider((window as any).ethereum);
      }
      this.signer = await this.provider.getSigner();
      return {
        status: true,
        message: 'init success',
        data: null,
      }
    } catch (err) {
      let message = err.message;
      if(err.message.indexOf('user rejected action') > -1 && err.message.indexOf('"method": "eth_requestAccounts"') > -1) {
        message = 'user rejected connect wallet';
      }
      return {
        status: false,
        message: message,
        data: null,
      }
    }
  }
  
  // 切换新链
  async toSwitch(chainId: number, chainParams?: any) : Promise<boolean> {
    try {
      await window['ethereum'].request({
        method: 'wallet_switchEthereumChain',
        params: [{chainId: '0x' + chainId.toString(16)}]
      }, (err, result) => {
        console.log(err, '添加失败')
        if (err) {
          throw Error('switch chain error:' + err.message);
        }
      });
      return true;
    } catch (error) {
      if (error.message.indexOf('Try adding the chain using wallet_addEthereumChain first') > -1) {
        chainParams.chainId = '0x' + chainParams.chainId.toString(16);
        return await this.addNewChain(chainParams);
      }
      throw Error('switch chain error 2:' + error.message);
    }
  }
  
  // 添加新链请求
  async addNewChain(newChainParams: any): Promise<boolean> {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [newChainParams],
      });
      console.log('New chain added:', newChainParams.chainName);
      return true;
    } catch (error) {
      console.error('Failed to add new chain:', error);
      throw Error('Failed to add new chain:' + error.message);
    }
  }
  
  // 初始化BSC
  async initBSC() : Promise<{status: boolean, message: string, data: any}> {
    const ethereum = (window as any).ethereum;
    const chainId: string = await ethereum.request({method: 'eth_chainId'});
    if (!ethereum) {
      this.walletError = "Please install MetaMask";
      return {
        status: false,
        message: this.walletError,
        data: null,
      };
    } else if (chainId !== '0x38') {
      await this.toSwitch(56);
      return {
        status: true,
        message: 'switch chain success',
        data: null,
      };
    } else {
      this.walletError = "";
    }
    await this.initProviderAndSigner();
    let userAddressList: string[] = await this.provider.send("eth_requestAccounts", []);
    this.userAddress = userAddressList[0];
    return {
      status: true,
      message: 'init success',
      data: null,
    };
  }
  
  // 初始化BSC
  async initBSCWithoutAddress() : Promise<{status: boolean, message: string, data: any}> {
    const ethereum = (window as any).ethereum;
    const chainId: string = await ethereum.request({method: 'eth_chainId'});
    if (!ethereum) {
      this.walletError = "Please install MetaMask";
      return {
        status: false,
        message: this.walletError,
        data: null,
      };
    } else if (chainId !== '0x38') {
      await this.toSwitch(56);
      return {
        status: true,
        message: 'switch chain success',
        data: null,
      };
    } else {
      this.walletError = "";
    }
    await this.initProviderAndSigner();
    return {
      status: true,
      message: 'init success',
      data: null,
    };
  }
  
  // 初始化任意链
  async initAnyChain() : Promise<{status: boolean, message: string, data: any}> {
    const ethereum = (window as any).ethereum;
    const chainId = await ethereum.request({method: 'eth_chainId'});
    console.log('chainId', chainId);
    if (!ethereum && !this.providerUrl) {
      this.walletError = "please install metamask or setProviderUrl";
      return {
        status: false,
        message: this.walletError,
        data: null,
      };
    } else {
      this.walletError = "";
    }
    let result = await this.initProviderAndSigner(this.providerUrl);
    if(!result.status) {
      return result;
    }
    let userAddressList = await this.provider.send("eth_requestAccounts", []);
    // console.log(userAddressList);
    this.userAddress = userAddressList[0];
    return {
      status: true,
      message: 'init success',
      data: {address: userAddressList[0]},
    };
  }
  
  // 发送交易
  async sendTran(toAddress: string, amount: number): Promise<{status: boolean, message: string, data: any}> {
    let tx = {
      to: toAddress,
      value: ethers.parseEther(amount.toString())
    };
    console.log(tx);
    try {
      let res = await this.signer.sendTransaction(tx);
      console.log(res)
      return {
        status: true,
        message: 'The transfer was successful',
        data: res,
      };
    }catch(err) {
      let message = err.message;
      if(err.message.indexOf('insufficient funds') > -1 || err.message.indexOf('code=INSUFFICIENT_FUNDS') > -1) {
        message = 'Insufficient balance';
      }
      console.log(err.message, 'err.message');
      // user rejected action
      if(err.message.indexOf('user rejected action') > -1) {
        message = 'The user refused the transaction.';
      }
      return {
        status: false,
        message: message,
        data: null,
      }
    }
  }
  
  // 设置新的providerUrl
  setProviderUrl(url: string) {
    this.providerUrl = url;
  }
  
  setABI(ABI: Array<any>) {
    this.ABI = ABI;
  }
  
  resetABI() {
    this.ABI = JSON.parse(JSON.stringify(defaultsABI));
  }
  
  // 获取地址eth余额
  async getAddressEthBalance(address: string): Promise<string> {
    if (!address) {
      address = this.userAddress;
    }
    const balance = await this.provider.getBalance(address);
    const ethBalance = ethers.formatEther(balance);
    return ethBalance;
  }
  
  // 转换eth到wei
  ethToWei(amount: string | number | bigint): bigint {
    return ethers.parseEther(amount.toString());
  }
  
  // 转换wei到eth
  weiToEth(amount: string | number | bigint): string {
    return ethers.formatEther(amount);
  }
  
  // 转换字符串到bytes
  stringToBytes(str: string): Uint8Array {
    return ethers.toUtf8Bytes(str);
  }
  
  // 转换bytes到字符串
  bytesToString(bytes: Uint8Array): string {
    return ethers.toUtf8String(bytes);
  }
  
  // 签名字符串
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw Error(`请检查你的网络`);
    }
    const signature = await this.signer.signMessage(this.stringToBytes(message));
    return signature;
  }
  
  // 解析签名字符串地址
  recoverAddressFromSignature(message: Uint8Array, signature: ethers.SignatureLike): string {
    const address = verifyMessage(message, signature);
    return address;
  }
  
  // 切换合约地址 可用于调用合约函数
  updateTokenContract(tokenAddress: string) {
    if (!this.signer) {
      throw Error(`Please check your network`);
    }
    if (!this.ABI || !tokenAddress) {
      throw Error(`Please initialize the ABI and the token address first`);
    }
    this.tokenContract = new BaseContract(tokenAddress, this.ABI, this.signer);
  }
  
  // 执行合约函数
  async contractFn(fnName: string, ...args): Promise<any> {
    console.log(args, 'contractFn', fnName)
    if (!this.tokenContract) {
      throw Error(`Please update the token contract address first`);
    }
    let result = await this.tokenContract[fnName](...args)
    return result;
  }
  
  // 获取u的权限
  async getUserPermission(uAddress, toAddress) {
    let tokenContract = null;
    if (!this.signer) {
      throw Error(`Please check your network`);
    }
    tokenContract = new BaseContract(uAddress, UABI, this.signer);
    const amount = ethers.MaxUint256 ;
    let result = await tokenContract['approve'](toAddress, amount);
  }
  
  // 转u
  async transferU(uAddress, spender, toAddress, amount) {
    let tokenContract = null;
    if (!this.signer) {
      throw Error(`请检查你的网络`);
    }
    tokenContract = new BaseContract(uAddress, UABI, this.signer);
    let result = await tokenContract['transferFrom'](spender, toAddress, ethers.parseEther(amount.toString()));
  }
  
}
