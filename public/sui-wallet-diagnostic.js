// Sui Wallet Diagnostic Script
// Copy and paste this entire script into your browser console (F12)

console.log('🔍 Sui Wallet Diagnostic Script Starting...');

// Function to check wallet detection
function diagnoseSuiWallet() {
    console.log('\n=== SUI WALLET DIAGNOSTIC REPORT ===');
    
    // 1. Environment Check
    console.log('\n1. ENVIRONMENT CHECK:');
    console.log('   Secure Context:', window.isSecureContext ? '✅ Yes' : '❌ No');
    console.log('   User Agent:', navigator.userAgent.includes('Chrome') ? '✅ Chrome' : '❌ Not Chrome');
    console.log('   Protocol:', window.location.protocol);
    console.log('   Host:', window.location.host);
    
    // 2. Wallet Object Detection
    console.log('\n2. WALLET OBJECT DETECTION:');
    const walletObjects = [
        'suiWallet',
        '__sui_wallet__',
        'sui',
        'SuiWallet',
        '__sui_wallet_kit__'
    ];
    
    let foundAny = false;
    walletObjects.forEach(name => {
        try {
            const obj = window[name];
            if (obj && typeof obj === 'object') {
                console.log(`   ✅ window.${name}: Found`);
                console.log(`      Type: ${typeof obj}`);
                console.log(`      Methods: ${Object.keys(obj).join(', ')}`);
                foundAny = true;
            } else {
                console.log(`   ❌ window.${name}: Not found`);
            }
        } catch (e) {
            console.log(`   ❌ window.${name}: Error - ${e.message}`);
        }
    });
    
    // 3. All Window Properties Check
    console.log('\n3. ALL WINDOW PROPERTIES CHECK:');
    const allProps = Object.keys(window).filter(key => 
        key.toLowerCase().includes('sui') || 
        key.toLowerCase().includes('wallet') ||
        key.toLowerCase().includes('dapp')
    );
    
    if (allProps.length > 0) {
        console.log(`   Found ${allProps.length} wallet-related properties:`);
        allProps.forEach(prop => {
            const obj = window[prop];
            console.log(`   • ${prop}: ${typeof obj}`);
            if (obj && typeof obj === 'object') {
                console.log(`     Methods: ${Object.keys(obj).join(', ')}`);
            }
        });
    } else {
        console.log('   ❌ No wallet-related properties found');
    }
    
    // 4. Chrome Extensions API Check
    console.log('\n4. CHROME EXTENSIONS API CHECK:');
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            console.log('   ✅ chrome.runtime available');
            if (chrome.runtime.getManifest) {
                console.log('   ✅ chrome.runtime.getManifest available');
            }
        } else {
            console.log('   ❌ chrome.runtime not available');
        }
    } catch (e) {
        console.log(`   ❌ Chrome API error: ${e.message}`);
    }
    
    // 5. Extension Detection via Chrome API
    console.log('\n5. EXTENSION DETECTION VIA CHROME API:');
    try {
        if (chrome && chrome.runtime && chrome.runtime.getManifest) {
            const manifest = chrome.runtime.getManifest();
            console.log('   ✅ Current extension manifest:', manifest.name);
        }
    } catch (e) {
        console.log('   ❌ Cannot access current extension manifest');
    }
    
    // 6. Check for injected scripts
    console.log('\n6. INJECTED SCRIPTS CHECK:');
    const scripts = document.querySelectorAll('script');
    let suiScripts = 0;
    scripts.forEach(script => {
        if (script.src && script.src.includes('sui')) {
            suiScripts++;
            console.log(`   ✅ Found Sui script: ${script.src}`);
        }
    });
    if (suiScripts === 0) {
        console.log('   ❌ No Sui-related scripts found');
    }
    
    // 7. Final Diagnosis
    console.log('\n7. FINAL DIAGNOSIS:');
    if (foundAny) {
        console.log('   🎉 Sui Wallet detected! The extension is working.');
        console.log('   💡 Try connecting using the wallet object methods.');
    } else {
        console.log('   ❌ Sui Wallet not detected. Possible issues:');
        console.log('      • Extension not installed');
        console.log('      • Extension not enabled');
        console.log('      • Extension not pinned to toolbar');
        console.log('      • Extension permissions issue');
        console.log('      • Extension version incompatibility');
        console.log('      • Browser security restrictions');
    }
    
    console.log('\n=== END DIAGNOSTIC REPORT ===');
}

// Function to test connection
async function testWalletConnection() {
    console.log('\n🔄 Testing wallet connection...');
    
    const wallet = window.suiWallet || window.__sui_wallet__;
    
    if (!wallet) {
        console.log('❌ No wallet object found to test');
        return;
    }
    
    console.log(`✅ Found wallet object: ${Object.keys(wallet).join(', ')}`);
    
    try {
        if (typeof wallet.connect === 'function') {
            console.log('🔄 Testing wallet.connect()...');
            const result = await wallet.connect();
            console.log(`✅ wallet.connect() successful:`, result);
        } else if (typeof wallet.requestPermissions === 'function') {
            console.log('🔄 Testing wallet.requestPermissions()...');
            await wallet.requestPermissions();
            console.log('✅ wallet.requestPermissions() successful');
        } else {
            console.log('⚠️ No connect or requestPermissions method found');
        }
        
        if (typeof wallet.getAccounts === 'function') {
            console.log('🔄 Testing wallet.getAccounts()...');
            const accounts = await wallet.getAccounts();
            console.log(`✅ getAccounts() result:`, accounts);
        }
        
    } catch (error) {
        console.log(`❌ Connection test failed: ${error.message}`);
    }
}

// Auto-run diagnosis
diagnoseSuiWallet();

// Export functions for manual testing
window.diagnoseSuiWallet = diagnoseSuiWallet;
window.testWalletConnection = testWalletConnection;

console.log('\n💡 Manual testing available:');
console.log('   • diagnoseSuiWallet() - Run full diagnosis');
console.log('   • testWalletConnection() - Test wallet connection');
