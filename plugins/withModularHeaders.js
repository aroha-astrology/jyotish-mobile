// v9 — per-pod modular_headers for Firebase deps only.
//
// use_modular_headers! globally caused "Redefinition of module 'ReactCommon'"
// because React Native pods already declare their own module maps via pod specs.
//
// Per-pod :modular_headers => true is targeted — only affects the listed pods.
// We need module maps for every Firebase pod that gets @import-ed during
// compilation of FirebaseAuth (ObjC) or FirebaseCoreInternal (Swift) in v20:
//   - GoogleUtilities        — used by FirebaseCoreInternal (Swift)
//   - FirebaseCore           — @import FirebaseCore appears in FirebaseAuth & Internal
//   - FirebaseAuthInterop    — @import-ed by FirebaseAuth
//   - FirebaseAppCheckInterop — @import-ed by FirebaseAuth via app check chain
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf-8');

      const MARKER = '# [withModularHeaders] firebase-modular-deps';
      if (!podfile.includes(MARKER)) {
        const injection = [
          `  ${MARKER}`,
          `  pod 'GoogleUtilities', :modular_headers => true`,
          `  pod 'FirebaseCore', :modular_headers => true`,
          `  pod 'FirebaseAuthInterop', :modular_headers => true`,
          `  pod 'FirebaseAppCheckInterop', :modular_headers => true`,
        ].join('\n');
        podfile = podfile.replace(
          /^(target '[^']+' do\n)/m,
          `$1${injection}\n`
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
