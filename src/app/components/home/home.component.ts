import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RequestDataItem} from "../../../models/RequestDataItem";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {UrlInfoComponent} from "../url-info/url-info.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  title = 'http-proxy-chrome-extension';
  tabId: any;
  urls: string[] = [];
  requestData: RequestDataItem[] = [];

  constructor(private changeDetection: ChangeDetectorRef,
              private _bottomSheet: MatBottomSheet,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.registerListener();
  }

  registerListener() {

    chrome.webRequest.onBeforeRequest.addListener((details) => {

        this.requestData.push({
          url: details.url,
          method: details.method,
          tabId: details.tabId,
          requestBody: details.requestBody,
          type: details.type,
        });

        this.changeDetection.detectChanges();
      },
      {
        urls: ["<all_urls>"],
      });
  }

  removeStorage() {
    //chrome.storage.sync.remove('req_data', () => {
    //  this.loadDataFromStorage();
    //});

    chrome.runtime.sendMessage('get-user-data', (response) => {
      // 3. Got an asynchronous response with the data from the service worker
      console.log('received user data', response);
      //initializeUI(response);
    });

  }
}
