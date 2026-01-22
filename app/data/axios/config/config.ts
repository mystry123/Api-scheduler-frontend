import prod from "./config-production";
import stag from "./config-staging";
import { ENV_VARIABLES } from "./env";

let config = stag;
if (ENV_VARIABLES.VITE_ACTIVE_ENV === "PRODUCTION") {
  config = prod;
} else {
  config = stag;
}

const allConfig = {
  ...config,
  envConf: ENV_VARIABLES,
  activeEnv: ENV_VARIABLES.VITE_ACTIVE_ENV,
};

export const CONFIG = allConfig;
