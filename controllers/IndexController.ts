import {BaseController, get, view} from "./BaseController";

export class IndexController extends BaseController{
    constructor(){
        // Call the base constructor
        super();
        
        BaseController.RegisterController(this);
    }
    
    @get('*')
    @view('index')
    public Index(){
        var model = {
            title: 'My first page!',
            content: 'The content of my first page...'
        }
        
        return model;
    }
}