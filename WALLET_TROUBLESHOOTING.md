# 🔧 Sui Wallet Connection Troubleshooting Guide

## Quick Diagnostic Steps

### Step 1: Run Browser Console Diagnostic
1. **Open your browser console** (Press F12)
2. **Go to**: `http://localhost:3000/sui-wallet-diagnostic.js`
3. **Copy the entire script** and paste it into the console
4. **Press Enter** to run the diagnostic

### Step 2: Manual Verification Checklist

#### ✅ Extension Installation Check
- [ ] Go to `chrome://extensions/`
- [ ] Find "Sui Wallet" in the list
- [ ] Make sure the toggle is **ON** (blue/enabled)
- [ ] If not enabled, click the toggle to enable it

#### ✅ Extension Visibility Check
- [ ] Look for the **puzzle piece icon** in your browser toolbar
- [ ] Click the puzzle piece icon
- [ ] Find "Sui Wallet" in the dropdown
- [ ] Click the **pin icon** next to "Sui Wallet"
- [ ] You should now see the Sui Wallet icon (dark square with 'S') in your toolbar

#### ✅ Extension Functionality Check
- [ ] Click the **Sui Wallet icon** in your toolbar
- [ ] The Sui Wallet should open in a popup or new tab
- [ ] If it doesn't open, the extension may be broken

#### ✅ Account Setup Check
- [ ] In Sui Wallet, create an account or import an existing one
- [ ] Make sure you're on **TESTNET** (not Mainnet)
- [ ] Switch to Testnet in Sui Wallet settings if needed

#### ✅ Permissions Check
- [ ] Right-click on Sui Wallet icon → "Manage extension"
- [ ] Make sure it has permission to access `localhost`
- [ ] Check "Allow in incognito" if testing in incognito mode

### Step 3: Test Pages Available

1. **Simple HTML Test**: `http://localhost:3000/wallet-test.html`
   - Pure HTML, no frameworks
   - Click "Test Wallet Detection"

2. **Enhanced Manual Test**: `http://localhost:3000/manual-wallet-test`
   - Next.js page with detailed detection
   - Click "Check Extension Status"

3. **Browser Test**: `http://localhost:3000/browser-test`
   - Comprehensive browser environment test
   - Click "Run Browser Test"

4. **dApp Kit Test**: `http://localhost:3000/wallet-test`
   - Official Sui dApp Kit integration test
   - Uses ConnectButton component

### Step 4: Common Issues & Solutions

#### Issue 1: Extension Not Detected
**Symptoms**: All tests show "No wallet objects found"
**Solutions**:
- Reinstall Sui Wallet extension
- Try different browser (Edge, Brave, Firefox)
- Clear browser cache and cookies
- Disable other wallet extensions temporarily

#### Issue 2: Extension Detected But Not Connecting
**Symptoms**: Wallet objects found but connection fails
**Solutions**:
- Make sure you have an account in Sui Wallet
- Switch to TESTNET in Sui Wallet
- Try opening Sui Wallet directly first
- Check extension permissions

#### Issue 3: Extension Opens But No API
**Symptoms**: Sui Wallet opens but no `window.suiWallet` object
**Solutions**:
- Update Sui Wallet to latest version
- Try incognito mode
- Check if extension is properly installed
- Restart browser completely

#### Issue 4: Security Context Issues
**Symptoms**: "Not secure context" errors
**Solutions**:
- Make sure you're using `https://` or `localhost`
- Don't use `http://` with non-localhost domains
- Check browser security settings

### Step 5: Alternative Testing Methods

#### Method 1: Incognito Mode
1. Open incognito/private window
2. Go to `http://localhost:3000/wallet-test.html`
3. Test wallet detection

#### Method 2: Different Browser
1. Try Edge, Brave, or Firefox
2. Install Sui Wallet in the new browser
3. Test wallet detection

#### Method 3: Extension Reinstall
1. Remove Sui Wallet from `chrome://extensions/`
2. Go to Chrome Web Store
3. Reinstall Sui Wallet
4. Test again

### Step 6: Manual Console Commands

Run these in browser console (F12):

```javascript
// Check for wallet objects
console.log('suiWallet:', window.suiWallet);
console.log('__sui_wallet__:', window.__sui_wallet__);

// Check all wallet-related properties
Object.keys(window).filter(k => k.toLowerCase().includes('sui') || k.toLowerCase().includes('wallet'));

// Check Chrome extensions
console.log('chrome:', typeof chrome);
console.log('chrome.runtime:', chrome?.runtime);

// Test connection if wallet found
if (window.suiWallet) {
    window.suiWallet.connect().then(console.log).catch(console.error);
}
```

## Expected Results

### ✅ Working Wallet Detection
```
✅ window.suiWallet: Found
   Type: object
   Methods: connect, disconnect, getAccounts, hasPermissions
```

### ❌ Not Working
```
❌ window.suiWallet: Not found
❌ No wallet-related properties found
```

## Next Steps

1. **Run the diagnostic script** in browser console
2. **Share the results** with me
3. **Try the troubleshooting steps** above
4. **Test in different browsers** if needed

The diagnostic script will give us the exact information needed to fix your wallet connection issue.
