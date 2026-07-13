const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const email = 'gamerxmr09@gmail.com';

async function grantAdminRole() {
  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`\n✅ Success! ${email} has been granted Admin rights.`);
    console.log('You may need to sign out and sign back into the app for the changes to take effect.\n');
    
  } catch (error) {
    console.error('❌ Error granting admin role:', error);
  } finally {
    process.exit();
  }
}

grantAdminRole();
