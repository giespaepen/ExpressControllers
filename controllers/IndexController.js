"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const BaseController_1 = require("./BaseController");
class IndexController extends BaseController_1.BaseController {
    constructor() {
        // Call the base constructor
        super();
        BaseController_1.BaseController.RegisterController(this);
    }
    Index() {
        var model = {
            title: 'My first page!',
            content: 'The content of my first page...'
        };
        return this;
    }
}
__decorate([
    BaseController_1.get('/'),
    BaseController_1.view('index'), 
    __metadata('design:type', Function), 
    __metadata('design:paramtypes', []), 
    __metadata('design:returntype', void 0)
], IndexController.prototype, "Index", null);
exports.IndexController = IndexController;

//# sourceMappingURL=IndexController.js.map
