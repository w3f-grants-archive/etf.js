import { Etf, DistanceBasedSlotScheduler } from '@ideallabs/etf.js'
import './App.css'
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { Keyring } from '@polkadot/api';


// import chainSpec from './resources/etfTestSpecRaw.json';
import abi from './resources/transmutation.json';
import contractFile from './resources/transmutation.contract.json';
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { CodePromise, ContractPromise } from '@polkadot/api-contract';
// import { hexToU8a } from '@polkadot/util'
import { EtfContext } from './EtfContext';
import WalletConnect from './components/connect/connect.component';
import CreateWorld from './components/world/create-world/create-world';


import {
  createBrowserRouter,
  Link,
  RouterProvider,
} from "react-router-dom"
import WorldView from './components/world/world-view/world-view';
import WorldRegistry from './components/world/world-registry/world-registry';
import Box from './components/world/box/box';
import { Canvas } from '@react-three/fiber';
import Controls from './components/controls';
import Scene from './components/scene';
import { Light } from 'three';
import Layout from './components/layout/layout';
import Transmutation from './components/transmutation/transmutation';

function App() {
  const [etf, setEtf] = useState(null)
  // const [alice, setAlice] = useState(null)
  const [latestSlot, setLatestSlot] = useState(null)
  const [latestBlock, setLatestBlock] = useState(null)
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleSignerChange = useCallback((newSigner) => {
    setSigner(newSigner)
 }, []);

 const TYPES  = {
  OpaqueAssetId: 'Vec<u8>'
 }

 const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <WorldView key={'default'} />
      },
      {
        path: "/:accountId",
        element: <WorldView />
      },
      {
        path: "/registry",
        element: <WorldRegistry />
      },
      {
        path: "/transmute",
        element: <Transmutation />
      }
    ]
  },
 ]);


  useEffect(() => {

    if (process.env.REACT_APP_CONTRACT_ADDRESS === undefined) {
      console.error("no contract address provided");
      process.kill();
    }

    const setup = async () => {
      
      await cryptoWaitReady();
      let etf = new Etf("ws://127.0.0.1:9944")
      // let etf = new Etf("wss://etf1.idealabs.network:443")
      await etf.init(null, TYPES)
      setEtf(etf)

      // const keyring = new Keyring()
      // const alice = keyring.addFromUri('//Alice', { name: 'Alice' }, 'sr25519')
      // setAlice(alice)

      const contract = new ContractPromise(etf.api, abi, process.env.REACT_APP_CONTRACT_ADDRESS);
      setContract(contract);

      etf.eventEmitter.on('blockHeader', () => {
        setLatestSlot(etf.latestSlot)
        setLatestBlock(etf.latestBlockNumber)
      })
    }
    setup()
  }, [])

  return (
    <div className="App">
      <div className="header">
        Transmutation
      </div>
      { latestSlot === null ? <div>Loading...</div>  : 
      <div className="app-body">
        <div className='wallet-component'>
          { etf === null ? 
          <div>
            <span>Loading...</span>
          </div> :
          <div>
            <EtfContext.Provider value={{etf}} >
              <WalletConnect setSigner={handleSignerChange} />
            </EtfContext.Provider>
          </div>
          }
        </div>
        <div className='app-body'>
          { etf === null || signer === null ? <div></div> : 
          <div>
            { contract.address.toString() }
            <EtfContext.Provider value={{etf, signer, contract, latestSlot, latestBlock}} >
              <RouterProvider router={router} />
            </EtfContext.Provider>
          </div>
          }
        </div>
      </div>
      }
    </div>
  )
}

export default App
