{
  description = "A Node.js application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ (final: prev: {
            cacert = prev.cacert.override {
              blacklist = [ "Comodo AAA Services root" "emSign ECC Root CA - G3" ];
            };
          }) ];
        };
        root = ./.;
        secureNode = pkgs.writeShellScriptBin "node" ''
          export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          export SSL_CERT_DIR=${pkgs.emptyDirectory}
          exec ${pkgs.nodejs}/bin/node --use-openssl-ca "$@"
        '';
      in
      {
        devShell = pkgs.mkShell {
          SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
          SSL_CERT_DIR = "${pkgs.emptyDirectory}";
          NODE_OPTIONS = "--use-openssl-ca";
          buildInputs = with pkgs; [
            nodejs
            python3
          ];
        };

        packages = {
          PS-bot = pkgs.stdenv.mkDerivation {
            pname = "PS-bot";
            version = "1.0.3";

            src = root;

            buildInputs = [ pkgs.nodejs ];

            buildPhase = ''
              export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
              export SSL_CERT_DIR=${pkgs.emptyDirectory}
              export NODE_OPTIONS=--use-openssl-ca
              export HOME=$TMPDIR/home
              mkdir -p $HOME
              runHook preBuild
              ${pkgs.nodejs}/bin/npm install
              ${pkgs.nodejs}/bin/npm run build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r * $out
              runHook postInstall
            '';

            meta = with pkgs.lib; {
              description = "A Node.js application";
              license = licenses.mit;
              maintainers = with maintainers; [ "singiamtel" ];
            };
          };
        };

        apps.default = {
            type = "app";
            program = toString (pkgs.writeShellScript "ps-bot" ''
              exec ${secureNode}/bin/node ${self.packages.${system}.PS-bot}/dist/main.js "$@"
            '');
            # Ensure the working directory is set correctly
            workingDirectory = "${self.packages.${system}.PS-bot}";
        };

        services = {
          PS-bot = {
            enable = true;
            script = "${secureNode}/bin/node ${self.packages.${system}.PS-bot}/dist/main.js";
            serviceConfig = {
              Restart = "always";
              RestartSec = "5s";
            };
          };
        };

        # defaultApp = {
        #   inherit (self.apps) PS-bot;
        # };
      }
    );
}
