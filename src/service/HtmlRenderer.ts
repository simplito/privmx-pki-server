import * as AdvTemplate from "adv-template";

export class HtmlRenderer {
    
    renderFromTemplate(templateHtml: string, model: any, context: any, viewBag: any): string {
        const func = AdvTemplate.TemplateCompiler.compile(templateHtml);
        return func(model, context, new AdvTemplate.Helper(), viewBag);
    }
}
