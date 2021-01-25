import React, {useEffect, useState} from 'react'
import './App.css'
import styled, {createGlobalStyle} from 'styled-components'
import * as wanakana from 'wanakana'

import ReactFuri from 'react-furi'

import { Container, Form, Grid, Input, Label, List, Popup, Segment, Table } from 'semantic-ui-react'

import {kanjiData} from './kanjidata'

import {setCORS} from 'google-translate-api-browser'

const kuroshiro = new window.Kuroshiro()
const translate = setCORS('https://cors-anywhere.herokuapp.com/')

const BodyStyle = createGlobalStyle`
    body {
        background-color: #90A8C3;
    }

    input[type="text"] {
        width: 600px !important;
    }
`

// indices for the raw kanji data
const ENGLISH = 0
const KANJI = 1
const ONYOMI = 2
const KUNYOMI = 3
const EXAMPLES = 4
const TAGS = 5

const colors = ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'teal', 'yellow']

const earliestTags = {}
const indexedKanji = {}
kanjiData.forEach((k, idx) => {
    // index the name of the kanji first
    if (!(k[ENGLISH] in earliestTags)) {
        earliestTags[k[ENGLISH]] = idx
    }

    // also index all of the associated tags
    k[TAGS].forEach(t => {
        if (!(t in earliestTags)) {
            earliestTags[t] = idx
        }
    })

    indexedKanji[k[KANJI]] = {english: k[ENGLISH], tags: k[TAGS]}
})

const App = () => {
    const [searchText, setSearchText] = useState('')
    const [searchData, setSearchData] = useState([])
    const [translatedText, setTranslatedText] = useState('')
    const [searchTextHira, setSearchTextHira] = useState('')

    useEffect(async () => {
        await kuroshiro.init(new window.KuromojiAnalyzer({dictPath: './dict'}))
    }, [])

    useEffect(async () => {
        if (!searchText) return;

        translate(searchText, {to: 'en'}).then(res => {
            setTranslatedText(res.text)
        }).catch(err => console.error(err))

        let result = await kuroshiro.convert(searchText)
        setSearchTextHira(result)
        console.log(result)

        parseInput()
    }, [searchText])

    useEffect(() => {
        console.log(searchData)
    }, [searchData])

    const parseInput = () => {
        let currentHiraIndex = 0
        let newSearchData = [];

        [...searchText].forEach((c, idx) => {
            console.log(c)
            if (wanakana.isKanji(c)) {
                currentHiraIndex = idx+1
                newSearchData.push({text: c, color: colors[Math.floor(Math.random() * colors.length)]})
            } else {
                if (!newSearchData[currentHiraIndex]?.text) {
                    newSearchData[currentHiraIndex] = {text: c, color: 'white'}
                } else {
                    newSearchData[currentHiraIndex].text += c
                }
            }
        })

        setSearchData(newSearchData)
    }

    return (
        <div className="App">
            <BodyStyle />
            <Segment style={{backgroundColor: '#64A6BD', padding: '30px'}} vertical>
                <Grid centered>
                    <Grid.Row>
                        <Grid.Column width={8} textAlign='center'>
                            <Input
                                size='massive'
                                icon='search'
                                value={searchText}
                                onChange={(e, {value}) => setSearchText(value)}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>
            <Container style={{marginTop: '30px'}}>
                <ReactFuri
                    word={searchText}
                    reading={searchTextHira}
                />
                <p style={{textAlign: 'center', fontSize: '2rem'}}>{translatedText}</p>
                {searchData?.map(sd =>
                    <Popup
                        trigger={<Label size='huge' color={sd.color}>{sd.text}</Label>}
                        position='bottom'
                        style={{fontSize: '1.5rem'}}
                    >
                        <b>{indexedKanji[sd.text]?.english}</b>
                        <Table>
                            <Table.Body>
                                {indexedKanji[sd.text]?.tags.map(t =>
                                    <Table.Row>
                                        <Table.Cell>{t}</Table.Cell>
                                        <Table.Cell>{kanjiData[earliestTags[t]][KANJI]}</Table.Cell>
                                    </Table.Row>  
                                )}
                            </Table.Body>
                        </Table>
                    </Popup>
                )}
            </Container>
        </div>
    )
}

export default App
