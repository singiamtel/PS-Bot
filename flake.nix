{
  description = "A Node.js application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        root = ./.;
      in
      {
        devShell = pkgs.mkShell {
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
              export NODE_EXTRA_CA_CERTS=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
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
            program = "${pkgs.nodejs}/bin/node ${self.packages.${system}.PS-bot}/dist/main.js";
            # Ensure the working directory is set correctly
            workingDirectory = "${self.packages.${system}.PS-bot}";
        };

        services = {
          PS-bot = {
            enable = true;
            script = "${pkgs.nodejs}/bin/node ${self.packages.${system}.PS-bot}/dist/main.js";
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
