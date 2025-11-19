import { Note } from '../models/Note.js';

export async function listNotes(req, res, next) {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    next(error);
  }
}

export async function createNote(req, res, next) {
  try {
    const note = await Note.create(req.body);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
}
