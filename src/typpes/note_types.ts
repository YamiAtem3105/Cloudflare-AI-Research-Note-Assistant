import {
	createTextNoteService,
	createFileNoteService,
	getNoteService,
	listNotesService,
	ValidationError,
	NotFoundError,
} from "../services/note.service";

export async function createNote(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		const contentType =
			request.headers.get("content-type") || "";

		if (contentType.includes("application/json")) {
			const body = await request.json();

			const result =
				await createTextNoteService(
					env,
					body.title,
					body.content,
				);

			return Response.json(result, {
				status: 201,
			});
		}

		if (
			contentType.includes(
				"multipart/form-data",
			)
		) {
			const formData =
				await request.formData();

			const title = formData.get("title");
			const file = formData.get("file");

			if (!(file instanceof File)) {
				return Response.json(
					{
						error: "File is required.",
					},
					{ status: 400 },
				);
			}

			const result =
				await createFileNoteService(
					env,
					title,
					file,
				);

			return Response.json(result, {
				status: 201,
			});
		}

		return Response.json(
			{
				error:
					"Content-Type must be application/json or multipart/form-data.",
			},
			{ status: 400 },
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			return Response.json(
				{ error: error.message },
				{ status: 400 },
			);
		}

		console.error("Create note error:", error);

		return Response.json(
			{ error: "Failed to create note." },
			{ status: 500 },
		);
	}
}

export async function listNotes(
	_request: Request,
	env: Env,
): Promise<Response> {
	try {
		const notes =
			await listNotesService(env);

		return Response.json(notes);
	} catch (error) {
		console.error("List notes error:", error);

		return Response.json(
			{ error: "Failed to list notes." },
			{ status: 500 },
		);
	}
}

export async function getNote(
	_request: Request,
	env: Env,
	id: string,
): Promise<Response> {
	try {
		const note =
			await getNoteService(env, id);

		if (!note) {
			return Response.json(
				{ error: "Note not found." },
				{ status: 404 },
			);
		}

		return Response.json(note);
	} catch (error) {
		console.error("Get note error:", error);

		return Response.json(
			{ error: "Failed to get note." },
			{ status: 500 },
		);
	}
}