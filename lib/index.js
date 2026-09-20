//#region lib/index.js
/**
 * dsh-caonima (核动力草泥马), node half. The empty apply gives the Loader a host-side row
 * so the client-modules scan picks up this package's `dsh.client` declaration;
 * the browser half (lib/client.js) ships the actual pet.
 */
/** Host plugin body — this package contributes browser presentation only. */
function apply() {}
//#endregion
export { apply };
