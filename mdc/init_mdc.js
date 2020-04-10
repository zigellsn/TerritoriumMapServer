/*
 * Copyright 2019-2020 Simon Zigelli
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {MDCRipple} from '@material/ripple/index';
import {MDCTextField} from '@material/textfield';
import {MDCDataTable} from '@material/data-table';
import {MDCTopAppBar} from '@material/top-app-bar';

const ripple = new MDCRipple(document.querySelector('.mdc-button'));
const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
const dataTable = new MDCDataTable(document.querySelector('.mdc-data-table'));
const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement);