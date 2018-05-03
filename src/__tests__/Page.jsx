import React from 'react';
import { mount, shallow } from 'enzyme';

import { pdfjs } from '../entry.jest';

import { PageInternal as Page } from '../Page';

import failingPdf from '../../__mocks__/_failing_pdf';
import silentlyFailingPdf from '../../__mocks__/_silently_failing_pdf';
import { loadPDF, makeAsyncCallback, muteConsole, restoreConsole } from './utils';

const pdfFile = loadPDF('./__mocks__/_pdf.pdf');

/* eslint-disable comma-dangle */

describe('Page', () => {
  // Loaded PDF file
  let pdf;

  // Object with basic loaded page information that shall match after successful loading
  const desiredLoadedPage = {};
  const desiredLoadedPage2 = {};

  // Callbacks used in registerPage and unregisterPage callbacks
  const registerPageArguments = [];
  let unregisterPageArguments = null;

  beforeAll(async () => {
    pdf = await pdfjs.getDocument({ data: pdfFile.arrayBuffer });

    const page = await pdf.getPage(1);
    desiredLoadedPage.pageIndex = page.pageIndex;
    desiredLoadedPage.pageInfo = page.pageInfo;

    const page2 = await pdf.getPage(2);
    desiredLoadedPage2.pageIndex = page2.pageIndex;
    desiredLoadedPage2.pageInfo = page2.pageInfo;

    registerPageArguments.push(
      page.pageIndex,
      undefined, // Page reference is not defined in Enzyme
    );
    unregisterPageArguments = page.pageIndex;
  });

  describe('loading', () => {
    it('loads a page and calls onLoadSuccess callback properly', async () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      await expect(onLoadSuccessPromise).resolves.toMatchObject(desiredLoadedPage);
    });

    it('returns all desired parameters in onLoadSuccess callback', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(5);
      return onLoadSuccessPromise.then((page) => {
        component.update();
        expect(page.width).toBeDefined();
        expect(page.height).toBeDefined();
        expect(page.originalWidth).toBeDefined();
        expect(page.originalHeight).toBeDefined();
        // Example of a method that got stripped away in the past
        expect(page.getTextContent).toBeInstanceOf(Function);
      });
    });

    it('calls onLoadError when failed to load a page', async () => {
      const { func: onLoadError, promise: onLoadErrorPromise } = makeAsyncCallback();

      muteConsole();

      shallow(
        <Page
          onLoadError={onLoadError}
          pageIndex={0}
          pdf={failingPdf}
        />
      );

      expect.assertions(1);
      await expect(onLoadErrorPromise).resolves.toBeInstanceOf(Error);

      restoreConsole();
    });

    it('loads page when given pageIndex', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        expect(component.state().page).toMatchObject(desiredLoadedPage);
      });
    });

    it('loads page when given pageNumber', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageNumber={1}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        expect(component.state().page).toMatchObject(desiredLoadedPage);
      });
    });

    it('calls registerPage when loaded a page', async () => {
      const { func: registerPage, promise: registerPagePromise } = makeAsyncCallback();

      shallow(
        <Page
          pageIndex={0}
          pdf={pdf}
          registerPage={registerPage}
        />
      );

      expect.assertions(1);
      await expect(registerPagePromise).resolves.toMatchObject(registerPageArguments);
    });

    it('calls unregisterPage on unmount', async () => {
      const { func: unregisterPage, promise: nuregisterPagePromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          pageIndex={0}
          pdf={pdf}
          unregisterPage={unregisterPage}
        />
      );

      component.unmount();

      expect.assertions(1);
      await expect(nuregisterPagePromise).resolves.toBe(unregisterPageArguments);
    });

    it('replaces a page properly', async () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const mountedComponent = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(2);
      await expect(onLoadSuccessPromise).resolves.toMatchObject(desiredLoadedPage);

      const { func: onLoadSuccess2, promise: onLoadSuccessPromise2 } = makeAsyncCallback();

      mountedComponent.setProps({
        onLoadSuccess: onLoadSuccess2,
        pageIndex: 1,
      });

      await expect(onLoadSuccessPromise2).resolves.toMatchObject(desiredLoadedPage2);
    });

    it('throws an error when placed outside Document', () => {
      expect(() => shallow(<Page pageIndex={0} />)).toThrow();
    });
  });

  describe('rendering', () => {
    it('applies className to its wrapper when given a string', () => {
      const className = 'testClassName';

      const component = shallow(
        <Page
          className={className}
          pageIndex={0}
          pdf={pdf}
        />
      );

      const wrapperClassName = component.find('.react-pdf__Page').prop('className');

      expect(wrapperClassName.includes(className)).toBe(true);
    });

    it('passes container element to inputRef properly', () => {
      const inputRef = jest.fn();

      mount(
        <Page
          inputRef={inputRef}
          pageIndex={1}
          pdf={silentlyFailingPdf}
        />
      );

      expect(inputRef).toHaveBeenCalled();
      expect(inputRef.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    });

    it('renders "No page specified." when given neither pageIndex nor pageNumber', () => {
      muteConsole();

      const component = shallow(
        <Page pdf={pdf} />
      );

      const noData = component.find('.react-pdf__message--no-data');

      expect(noData).toHaveLength(1);
      expect(noData.text()).toBe('No page specified.');

      restoreConsole();
    });

    it('renders custom no data message when given nothing and noData prop is specified', () => {
      muteConsole();

      const component = shallow(
        <Page
          noData="Nothing here"
          pdf={pdf}
        />
      );

      const noData = component.find('.react-pdf__message--no-data');

      expect(noData).toHaveLength(1);
      expect(noData.text()).toBe('Nothing here');

      restoreConsole();
    });

    it('renders "Loading page…" when loading a page', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(2);
      return onLoadSuccessPromise.then(() => {
        const loading = component.find('.react-pdf__message--loading');

        expect(loading).toHaveLength(1);
        expect(loading.text()).toBe('Loading page…');
      });
    });

    it('renders custom loading message when loading a page and loading prop is specified', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          loading="Loading"
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(2);
      return onLoadSuccessPromise.then(() => {
        const loading = component.find('.react-pdf__message--loading');

        expect(loading).toHaveLength(1);
        expect(loading.text()).toBe('Loading');
      });
    });

    it('ignores pageIndex when given pageIndex and pageNumber', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          pageIndex={1}
          pageNumber={1}
          pdf={pdf}
          onLoadSuccess={onLoadSuccess}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        expect(component.state().page).toMatchObject(desiredLoadedPage);
      });
    });

    it('orders page to be rendered with default rotation when given nothing', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        expect(component.instance().rotate).toBe(0);
      });
    });

    it('requests page to be rendered with default rotation when given rotate prop', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          rotate={90}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        expect(component.instance().rotate).toBe(90);
      });
    });

    it('requests page to be rendered in canvas mode by default', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const pageCanvas = component.find('PageCanvas');
        expect(pageCanvas).toHaveLength(1);
      });
    });

    it('requests page to be rendered in canvas mode when given renderMode = "canvas"', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderMode="canvas"
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const pageCanvas = component.find('PageCanvas');
        expect(pageCanvas).toHaveLength(1);
      });
    });

    it('requests page to be rendered in SVG mode when given renderMode = "svg"', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderMode="svg"
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const pageCanvas = component.find('PageSVG');
        expect(pageCanvas).toHaveLength(1);
      });
    });

    it('requests text content to be rendered by default', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const textLayer = component.find('TextLayer');
        expect(textLayer).toHaveLength(1);
      });
    });

    it('requests text content to be rendered when given renderTextLayer = true', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderTextLayer
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const textLayer = component.find('TextLayer');
        expect(textLayer).toHaveLength(1);
      });
    });

    it('does not request text content to be rendered when given renderTextLayer = false', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderTextLayer={false}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const textLayer = component.find('TextLayer');
        expect(textLayer).toHaveLength(0);
      });
    });

    it('does not render TextLayer when given renderMode = "svg"', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderMode="svg"
          renderTextLayer
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const textLayer = component.find('TextLayer');
        expect(textLayer).toHaveLength(0);
      });
    });

    it('requests annotations to be rendered by default', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const annotationLayer = component.find('AnnotationLayer');
        expect(annotationLayer).toHaveLength(1);
      });
    });

    it('requests annotations to be rendered when given renderAnnotations = true', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderAnnotations
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const annotationLayer = component.find('AnnotationLayer');
        expect(annotationLayer).toHaveLength(1);
      });
    });

    it('does not request annotations to be rendered when given renderAnnotations = false', () => {
      const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();

      const component = shallow(
        <Page
          onLoadSuccess={onLoadSuccess}
          pageIndex={0}
          pdf={pdf}
          renderAnnotations={false}
        />
      );

      expect.assertions(1);
      return onLoadSuccessPromise.then(() => {
        component.update();
        const annotationLayer = component.find('AnnotationLayer');
        expect(annotationLayer).toHaveLength(0);
      });
    });
  });

  it('requests page to be rendered with a proper scale when given width', () => {
    const { func: onLoadSuccess, promise: onLoadSuccessPromise } = makeAsyncCallback();
    const width = 600;

    const component = shallow(
      <Page
        onLoadSuccess={onLoadSuccess}
        pageIndex={0}
        pdf={pdf}
        width={width}
      />
    );

    expect.assertions(1);
    return onLoadSuccessPromise.then((page) => {
      component.update();
      expect(page.width).toEqual(width);
    });
  });

  it('calls onClick callback when clicked a page (sample of mouse events family)', () => {
    const onClick = jest.fn();

    const component = mount(
      <Page
        onClick={onClick}
        pdf={pdf}
      />
    );

    const page = component.find('.react-pdf__Page');
    page.simulate('click');

    expect(onClick).toHaveBeenCalled();
  });

  it('calls onTouchStart callback when touched a page (sample of touch events family)', () => {
    const onTouchStart = jest.fn();

    const component = mount(
      <Page
        onTouchStart={onTouchStart}
        pdf={pdf}
      />
    );

    const page = component.find('.react-pdf__Page');
    page.simulate('touchstart');

    expect(onTouchStart).toHaveBeenCalled();
  });
});