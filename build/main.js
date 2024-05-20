"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_fs = __toESM(require("fs"));
var import_google = require("./lib/google");
class GoogleSpreadsheet extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "google-spreadsheet"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.spreadsheet = new import_google.SpreadsheetUtils(this.config, this.log);
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    this.log.debug("config spreadsheetId: " + this.config.spreadsheetId);
    this.spreadsheet = new import_google.SpreadsheetUtils(this.config, this.log);
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
  // /**
  //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  onMessage(obj) {
    if (typeof obj === "object" && obj.message) {
      switch (obj.command) {
        case "append": {
          this.log.debug("append to spreadsheet");
          this.append(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "deleteRows": {
          this.log.debug("delete rows from spreadsheet");
          this.deleteRows(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "createSheet": {
          this.log.debug("create sheet");
          this.createSheet(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "deleteSheet": {
          this.log.debug("delete sheet");
          this.deleteSheet(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "duplicateSheet": {
          this.log.debug("duplicate sheet");
          this.duplicateSheet(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "upload": {
          this.log.debug("upload file");
          this.upload(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "writeCell": {
          this.log.debug("write data to single cell");
          this.writeCell(obj);
          if (obj.callback)
            this.sendTo(obj.from, obj.command, "Message received", obj.callback);
          break;
        }
        case "readCell": {
          this.log.debug("read single cell");
          this.readCell(obj).then((result) => {
            if (obj.callback)
              this.sendTo(obj.from, obj.command, result, obj.callback);
          });
          break;
        }
        default: {
          this.log.warn("unknown command: " + obj.command);
          break;
        }
      }
    }
  }
  upload(message) {
    const messageData = message.message;
    if (this.missingParameters(["source", "target", "parentFolder"], messageData)) {
      return;
    }
    this.spreadsheet.upload(messageData["source"], messageData["target"], messageData["parentFolder"], import_fs.default.createReadStream(messageData["source"]));
  }
  append(message) {
    const messageData = message.message;
    if (this.missingParameters(["sheetName", "data"], messageData)) {
      return;
    }
    this.spreadsheet.append(messageData["sheetName"], messageData["data"]);
  }
  writeCell(message) {
    const messageData = message.message;
    if (this.missingParameters(["sheetName", "cell", "data"], messageData)) {
      return;
    }
    const cellPattern = new RegExp("[A-Z]+[0-9]+()");
    if (!cellPattern.test(messageData["cell"])) {
      this.log.error("Invalid cell pattern " + messageData["cell"] + ". Expected: A1");
      return;
    }
    this.spreadsheet.writeCell(messageData["sheetName"], messageData["cell"], messageData["data"]);
  }
  async readCell(message) {
    const messageData = message.message;
    if (this.missingParameters(["sheetName", "cell"], messageData)) {
      return;
    }
    const cellPattern = new RegExp("[A-Z]+[0-9]+()");
    if (!cellPattern.test(messageData["cell"])) {
      this.log.error("Invalid cell pattern " + messageData["cell"] + ". Expected: A1");
      return;
    }
    return await this.spreadsheet.readCell(messageData["sheetName"], messageData["cell"]);
  }
  deleteRows(message) {
    const messageData = message.message;
    if (this.missingParameters(["sheetName", "start", "end"], messageData)) {
      return;
    }
    this.spreadsheet.deleteRows(messageData["sheetName"], messageData["start"], messageData["end"]);
  }
  createSheet(message) {
    this.spreadsheet.createSheet(message.message);
  }
  deleteSheet(message) {
    this.spreadsheet.deleteSheet(message.message);
  }
  duplicateSheet(message) {
    const messageData = message.message;
    if (this.missingParameters(["source", "target", "index"], messageData)) {
      return;
    }
    this.spreadsheet.duplicateSheet(messageData["source"], messageData["target"], messageData["index"]);
  }
  missingParameters(neededParameters, messageData) {
    let result = false;
    for (const parameter of neededParameters) {
      if (Object.keys(messageData).indexOf(parameter) == -1) {
        result = true;
        this.log.error("The parameter '" + parameter + "' is required but was not passed!");
      }
    }
    return result;
  }
}
if (require.main !== module) {
  module.exports = (options) => new GoogleSpreadsheet(options);
} else {
  (() => new GoogleSpreadsheet())();
}
//# sourceMappingURL=main.js.map
