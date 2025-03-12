export function processFileInput(dataType ,input, callback) {
	const reader = new FileReader();
	
	if (dataType === 'text') {
		reader.readAsText(input.files[0]);
		
	} else if (dataType === 'dataURL') {
		reader.readAsDataURL(input.files[0]);
	}
	
	reader.onload = function() {
		callback(reader.result);
	};
}
