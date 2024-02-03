import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RequestDataItem} from "../../../models/RequestDataItem";

@Component({
  selector: 'app-url-info',
  templateUrl: './url-info.component.html',
  styleUrls: ['./url-info.component.scss']
})
export class UrlInfoComponent implements OnInit {
  requestData: RequestDataItem;

  constructor(
    public dialogRef: MatDialogRef<UrlInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RequestDataItem) {
  }

  ngOnInit() {
    this.requestData = this.data;
  }
}
