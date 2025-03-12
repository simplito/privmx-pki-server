import { MigrationId } from "../MigrationsManager";
import { MongoDbManager } from "../MongoDbManager";

export class Migration000Scheme {
    
    static id = "Migration000Scheme" as MigrationId;
    
    static async go(mongoDbManager: MongoDbManager) {
        const {collection: migrationCollection} = await mongoDbManager.createOrGetCollection("migrationx");
        await migrationCollection.createIndex({status: 1});
        
        const {collection: userCollection} = await mongoDbManager.createOrGetCollection("user");
        await userCollection.createIndex({email: 1}, {unique: true});
        
        const {collection: sessionCollection} = await mongoDbManager.createOrGetCollection("session");
        await sessionCollection.createIndex({user: 1});
        
        const {collection: apiKeyCollection} = await mongoDbManager.createOrGetCollection("api_key");
        await apiKeyCollection.createIndex({user: 1});
        
        await mongoDbManager.createOrGetCollection("token");
        
        await mongoDbManager.createOrGetCollection("event");
        
        await mongoDbManager.createOrGetCollection("cipher_key");
        
        await mongoDbManager.createOrGetCollection("mail_log");
        
        const {collection: mailTemplateRepository} = await mongoDbManager.createOrGetCollection<any>("mail_template");
        
        await mailTemplateRepository.insertOne({
            _id: "layout/mail",
            name: "Main layout",
            html: {
                en: `<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>{{@viewBag.subject}}</title>
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <style type="text/css">
        :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
        }
        body {
            background: white;
            color: #393939;
        }
        .main {
            line-height: 1.42857143;
            font-family: "Aneba", sans-serif;
            text-align: center;
        }
        .main-inner {
            padding: 20pt;
            font-size: 13pt;
            display: inline-block;
            text-align: left;
        }
        .subinfo-italic {
            margin-top: 10pt;
            font-size: 85%;
            font-style: italic;
        }
        .subinfo {
            margin-top: 10pt;
            font-size: 85%;
        }
        .img-cnt {
            text-align: center;
        }
        .img-cnt img {
            height: 72px;
            width: 84px;
        }
        .img-dark {
            display: none !important;
        }
        .img-light {
            display: inline-block !important;
        }
        a {
            color: rgb(73, 190, 218);
            text-decoration: none;
        }
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #000;
                color: #ccc;
            }
            .img-dark {
                display: inline-block !important;
            }
            .img-light {
                display: none !important;
            }
        }
        .unsubscribe-info {
            margin-top: 30px;
            color: #999;
            font-size: 85%;
        }
    </style>
</head>
<body>
    <div class="main">
        <div class="main-inner">
            <div class="img-cnt">
                <img class="img-light" width="84" height="72" border="0" alt="WebApp" style="font-weight:bold; font-size: 28px;" src="data:image/png;base64,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" />
                <!--[if !mso]><! -->
                <img class="img-dark" width="84" height="72" border="0" alt="WebApp" style="mso-hide: all; display: none; font-weight:bold; font-size: 28px;" src="data:image/png;base64,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" />
                <!--<![endif]-->
            </div>
            <br/>
            {{#model.body}}
        </div>
    </div>
</body>
</html>`,
            },
            updates: [],
        });
        
        await mailTemplateRepository.insertOne({
            _id: "emailVerification",
            name: "Email verification",
            html: {
                en: `{{viewBag.layout = "mail";}}
{{viewBag.subject = "WebApp email verification";}}
{{viewBag.from = "team";}}
Dear User,<br/>
<br/>
Please click the following link to verify your email address in WebApp:</br>
<a href="{{@model.link}}">{{@model.link}}</a><br/>
<br/>
Thank you,<br/>
WebApp Team`,
            },
            updates: [],
        });
        
        await mailTemplateRepository.insertOne({
            _id: "secondFactorCode",
            name: "2FA Code",
            html: {
                en: `{{viewBag.layout = "mail";}}
    {{viewBag.subject = "WebApp 2FA Code";}}
    {{viewBag.from = "team";}}
    Dear User,<br/>
    <br/>
    There is yours 2FA code:</br>
    <h2>{{@model.code}}</h2><br/>
    <br/>
    Thank you,<br/>
    WebApp Team`,
            },
            updates: [],
        });
    }
}
