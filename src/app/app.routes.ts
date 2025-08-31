import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { RequestResetPasswordComponent } from './auth/reset-password/request-reset-password/request-reset-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password/reset-password.component';

import { AuthGuard } from './core/auth.guard';
import { UnauthorizedComponent } from './shared/unauthorized/unauthorized.component';
import { NotFoundComponent } from './shared/notfound/notfound.component';

import { IOCCreationComponent } from './components/ioc/create/ioc-create.component';
import { IOCListComponent } from './components/ioc/list/ioc-list.component';
import { ViewIOCComponent } from './components/ioc/view/ioc-view.component';
import { IOCUpdateComponent } from './components/ioc/update/ioc-update.component';

import { HashEnrichmentComponent } from './components/enrichment/hash/hash-enrichment/hash-enrichment.component';
//import { FileHashResultsComponent } from './components/enrichment/hash/file-hash-results/file-hash-results.component';

import { IpEnrichmentComponent } from './components/enrichment/ip/ip-enrichment/ip-enrichment.component';
//import { IPResultsComponent } from './components/enrichment/ip/ip-results/ip-results.component';

import { UrlEnrichmentComponent } from './components/enrichment/url/url-enrichment/url-enrichment.component';
//import { UrlResultsComponent } from './components/enrichment/url/url-results/url-results.component';

import { DomainEnrichmentComponent } from './components/enrichment/domain/domain-enrichment/domain-enrichment.component';
//import { DomainResultsComponent } from './components/enrichment/domain/domain-results/domain-results.component';
import { ThreatFeedsComponent } from './components/feeds/threat-feeds/threat-feeds.component';
import { ChannelSubscriptionsComponent } from './components/subscriptions/channel-subscriptions/channel-subscriptions.component';
import { ThreatChartsComponent } from './components/dashboard/threat-charts/threat-charts.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BulkIoCCreatorComponent } from './components/ioc/bulk/bulk-ioc-creator.component';
import { OtxPulseDashboardComponent } from './components/dashboard/otx-charts/otx-pulse-dashboard.component';
export const routes: Routes = [

    // Authentification ////////////////
    { path: 'register', component: RegisterComponent },
    { path: 'request-reset-password', component: RequestResetPasswordComponent },
    { path: 'login',component:LoginComponent},
    { path: 'reset-password',component:ResetPasswordComponent},
    ///////////////////IOC ////////////////////////////////////
    {path:"iocs/create",component:IOCCreationComponent,canActivate: [AuthGuard]},
    {path:"iocs/edit/:id",component:IOCUpdateComponent,canActivate: [AuthGuard]},
    {path:"iocs/:id",component:ViewIOCComponent,canActivate: [AuthGuard]},
    {path:"iocs",component:IOCListComponent,canActivate: [AuthGuard]},
    {path:"iocs/create/bulk",component:BulkIoCCreatorComponent,canActivate: [AuthGuard]},
    ////////////////// Enrichment ///////////////////

    //////////Hash Enrichment //////////
    { path: 'enrichment/hash',component:HashEnrichmentComponent,canActivate: [AuthGuard]},
    //{ path:"enrichment/hash/:jobId",component:FileHashResultsComponent,canActivate: [AuthGuard]},
    //////////IP Enrichment //////////
    {path:'enrichment/ip',component:IpEnrichmentComponent,canActivate: [AuthGuard]},
    // { path:"enrichment/ip/:jobId",component:IPResultsComponent,canActivate: [AuthGuard]},

    //////////URL Enrichment //////////
    {path:'enrichment/url',component:UrlEnrichmentComponent,canActivate: [AuthGuard]},
    //{ path:"enrichment/url/:jobId",component:UrlResultsComponent,canActivate: [AuthGuard]},
    //////////Domain Enrichment //////////
    {path:'enrichment/domain',component:DomainEnrichmentComponent,canActivate: [AuthGuard]},
    //{ path:"enrichment/domain/:jobId",component:DomainResultsComponent,canActivate: [AuthGuard]},



    /////////////////////// RSS Feeds ///////////////////
    {path:'feeds',component:ThreatFeedsComponent,canActivate: [AuthGuard]},

    ////////////////// Channel Subscriptions /////////////
    {path:'subscriptions',component:ChannelSubscriptionsComponent,canActivate: [AuthGuard]},

    /////////////////////// Dashboard ///////////////////
    {path:'dashboard',component:DashboardComponent,canActivate: [AuthGuard]},
    {path:'dashboard/blacklist',component:ThreatChartsComponent,canActivate: [AuthGuard]},
    {path:'dashboard/otx',component:OtxPulseDashboardComponent,canActivate: [AuthGuard]},
    ///////////////////// Unauthorized //////////////////
    {path:'unauthorized',component:UnauthorizedComponent},
    ////////////// Landing Page ///////////////
    { path: '',component:HomeComponent},
    ////////////////////Not Found ///////////////////////
    {path:'**',component:NotFoundComponent}
    
    
];
