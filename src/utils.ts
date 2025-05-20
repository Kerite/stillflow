import { bcs } from "@mysten/sui/bcs";
import { fromHex, toHex } from "@mysten/sui/utils";

export const Address = bcs.bytes(32).transform({
    input: (val: string) => fromHex(val),
    output: (val) => `0x${toHex(val)}`,
});