/* Import External Modules */
import React , { Fragment, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from "react-router-dom";
import marked from 'marked';
import DiffMatchPatch from 'diff-match-patch';

/* Import files */
import './index.css';

/* Setup Stuff */
const dmp = new DiffMatchPatch();

const baseURL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3030/'
    : '/';

const socket = new WebSocket("ws://localhost:3030/");

function Viewer (props) {
    return(
      <article
        id="rendered"
        dangerouslySetInnerHTML={{__html: props.rendered}}
      ></article>
    )
}

function MarkdownEditor () {
    const [value, setValue] = useState('');
    const [rendered, setRendered] = useState('');

    const updateData = data => {
        setValue(data.value || value);
        setRendered(data.rendered || rendered);
    }

    const saveData = (data = {}) => {
        const writeData = Object.assign({value, rendered}, data);
        fetch(baseURL + 'api/page/1', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(writeData)
        });
    }

    const fetchData = async() => {
        const pageData = await fetch(baseURL + 'api/page/1').then(response => response.json());
        if(pageData.value) {
          updateData(pageData);
        }
    }

    const handleWSMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch(data.action) {
            case 'init':
            case 'update':
              updateData(data.body);
            break;
            case 'patchContent':
              const patched = dmp.patch_apply(data.body.value, value)[0];
              setValue(patched);
              setRendered(marked(patched));
            break;
            default:
              console.log('Unknown WS Event: ' + event.data);
          }
        } catch (err) {
          console.log('Unparseable WS Data: ' + event.data + '\n' + err);
        }
      }

      useEffect( () => {
        fetchData();
        socket.addEventListener('open', function (event) {
          socket.send('React Frontend Connection');
        });
      }, []);
    
      useEffect( () => {
        socket.addEventListener('message', handleWSMessage);
        return () => {
          socket.removeEventListener('message', handleWSMessage);
        }
      }, [value]);

      useEffect( () => {
        let timer = setTimeout(() => {
            saveData({value, rendered});
            timer = null;
        }, 2500);
        return () => {
          clearTimeout(timer);
        }
      });

      function handleContentChange(e) {
        setRendered(marked(e.target.value));
        if(socket.readyState === 1) {
          socket.send(JSON.stringify({
            action: "patchContent",
            body: {
              value: dmp.patch_make(value, e.target.value),
            },
          }));
        }
        setValue(e.target.value);
      }

      return (
        <Router>
          <Fragment>
            <Route exact path="/" render={()=>
            <div className="Editor">
              <div className="row">
                <div className="column">
                  <textarea id="rawContent"
                    value={value} onChange={handleContentChange} />
                </div>
                <div className="column">
                  <Viewer
                    rendered={rendered}
                  />
                </div>
              </div>
            </div>
            }/>
            <Route path="/view" render={() =>
              <Viewer
                rendered={rendered}
              />
            }/>
          </Fragment>
        </Router>
      )
}

ReactDOM.render(
  <MarkdownEditor />,
  document.getElementById('root')
);
