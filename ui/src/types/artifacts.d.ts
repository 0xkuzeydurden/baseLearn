declare module "../../artifacts/contracts/**/*.json" {
  const artifact: {
    abi: import("viem").Abi;
    bytecode: `0x${string}`;
  };
  export default artifact;
}
