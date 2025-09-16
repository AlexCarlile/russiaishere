declare module "*.png";
 
declare module "*.png" {
    const value: any;
    export default value;
}
 
declare module "*.png" {
    const value: any;
    export = value;
}

declare module "*.jpg" {
    const value: any;
    export default value;
}
 
declare module "*.jpg" {
    const value: any;
    export = value;
}

declare module 'file-saver';