import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import { Document, Page } from '@peergrade/react-pdf/dist/entry.webpack';
import { PDFViewer } from 'pdfjs-dist/lib/web/pdf_viewer';
import '@peergrade/react-pdf/dist/Page/AnnotationLayer.css';

import './Sample.less';

const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
};

class Sample extends Component {
  state = {
    file: './sample.pdf',
    viewer: null,
    numPages: null,
    pageNumber: 1,
  }

  componentDidMount() {
    this.setState({
      viewer: new PDFViewer({
        container: this.container,
      }),
    });

    this.container.addEventListener('pagechange', ({ pageNumber }) => {
      this.setState({ pageNumber })
    })

  }

  onFileChange = (event) => {
    this.setState({
      file: event.target.files[0],
    });
  }

  onDocumentLoadSuccess = ({ numPages }) =>
    this.setState({
      numPages,
    })

  onScaleChange = (value) => () => {
    if (typeof value === 'number') {
      this.state.viewer.currentScale += value;
    } else {
      this.state.viewer.currentScaleValue = value;
    }
  }

  onPageChange = (value) => () => {
    this.state.viewer.currentPageNumber += value;
  }

  render() {
    const { file, numPages, pageNumber, scale, viewer } = this.state;

    return (
      <div>
        <div className="Example">
          <div className="Example__toolbar">
            <div>
              <label htmlFor="file">Load from file:&nbsp;</label>
              <input
                type="file"
                onChange={this.onFileChange}
              />
              <button onClick={this.onScaleChange(0.1)}>+</button>
              <button onClick={this.onScaleChange(-0.1)}>-</button>
              <button onClick={this.onScaleChange('page-width')}>page width</button>
              <button onClick={this.onScaleChange('page-height')}>page height</button>
              {numPages && <span>{pageNumber} / {numPages}</span>}
            </div>
          </div>
          <div
            className="Example__container"
            ref={(e) => {
                this.container = e;
            }}
          >
            <div className="Example__container__document">
              {viewer && (
                 <Document
                   file={file}
                   onLoadSuccess={this.onDocumentLoadSuccess}
                   viewer={viewer}
                 />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default hot(module)(Sample);
